import { WcSdk, WitnessScope } from '@cityofzion/wallet-connect-sdk-core'
import { store } from '@/store'
import { batchUpdate } from '@/store/features/burger'
import constants from '../../constants'
import { getNep17Balance } from './rpcApi'
import { wallet } from '@cityofzion/neon-js'
import delay from 'delay'
import BigNumber from 'bignumber.js'

const wcInstance = new WcSdk()
const testnetKey = 'neo3:testnet'
const mainnetKey = 'neo3:mainnet'
const NEONWALLET_CONNECTED_KEY = 'NEONWALLET_CONNECTED'

interface DapiError {
	type: string
	description: string
	data: string
}

interface BalanceResponse {
	assethash: string
	amount: string
	lastupdatedblock: number
}

let initSuccess = false

async function initDapi(): Promise<void> {
	await wcInstance.initClient(
		'error', // logger: use 'debug' to show all log information on browser console, use 'error' to show only errors
		'wss://relay.walletconnect.org' // we are using walletconnect's official relay server
	)
	initSuccess = true

	wcInstance.subscribeToEvents({
		onProposal: (uri: string) => {
			window.open(`https://neon.coz.io/connect?uri=${uri}`, '_blank')?.focus()
		},
		onDeleted: () => disconnect(),
	})

	if (sessionStorage.getItem('preConnectWallet') === 'Neon') {
		await getAccount()
	}
}

async function getAccount(): Promise<void> {
	await wcInstance.loadSession()
	getNetwork(true)

	if (!wcInstance.session && initSuccess) {
		await wcInstance.connect({
			chains: [testnetKey, mainnetKey],
			methods: ['invokeFunction', 'testInvoke'],
			appMetadata: {
				name: 'NeoBurger',
				description: 'NeoBurger', // TODO: change this description
				url: location.href,
				icons: [`https://${location.host}/logo.png`],
			},
		})
		getNetwork(true)
	}
	sessionStorage.setItem(NEONWALLET_CONNECTED_KEY, 'true')
	sessionStorage.setItem('preConnectWallet', 'Neon')
	store.dispatch(
		batchUpdate({
			walletName: 'Neon',
			address: wcInstance.session && wcInstance.accountAddress ? wcInstance.accountAddress : '',
		})
	)
}

// 获取资产
function getBalance() {
	const address = store.getState().burger.address
	getNep17Balance(address)
		.then((result: { address: string; balance: BalanceResponse[] }) => {
			const balance: { [asset: string]: string } = {}
			result?.balance?.forEach((v) => {
				balance[v.assethash] = constants[v.assethash]
					? new BigNumber(v.amount).shiftedBy(constants[v.assethash]).toString()
					: v.amount
			})
			store.dispatch(batchUpdate({ balance }))
		})
		.catch((error: DapiError) => convertWalletError(error))
}

// 获取当前网络
async function getNetwork(shouldUpdate?: boolean) {
	if (wcInstance.session) {
		const network = await WcSdk.getChainId(wcInstance.session, 0)
		if (network && network.indexOf('mainnet') > 0) {
			shouldUpdate && store.dispatch(batchUpdate({ network: 'N3MainNet' }))
			return 'N3MainNet'
		} else if (network && network.indexOf('testnet') > 0) {
			shouldUpdate && store.dispatch(batchUpdate({ network: 'N3TestNet' }))
			return 'N3TestNet'
		}
	}
	return ''
}

// 转换
async function transfer(scriptHash: string, amount: string) {
	const address = store.getState().burger.address
	return wcInstance
		?.invokeFunction(
			[
				{
					scriptHash,
					operation: 'transfer',
					args: [
						{
							type: 'Address',
							value: address,
						},
						{
							type: 'Address',
							value: constants.TOADDRESS,
						},
						{
							type: 'Integer',
							value: amount,
						},
						{
							type: 'Any',
							value: null as any,
						},
					],
				},
			],
			[{ scopes: WitnessScope.CalledByEntry }]
		)
		.then(({ result }) => {
			if (result.error) {
				convertWalletError(result.error)
				return '-1'
			}
			return result
		})
		.catch((error: DapiError) => {
			convertWalletError(error)
			return '-1'
		})
		.then(async (result: string) => {
			if (result === '-1') {
				return {
					status: 'error',
				}
			} else {
				const status = await getApplicationLog(result)
				return {
					status,
					txid: result,
				}
			}
		})
}

// 领取NoBug
const claimNoBug = (scripthash: string, amount: string, nonce: string, proof: string[]) => {
	return wcInstance
		?.invokeFunction(
			[
				{
					scriptHash: constants.NOBUG,
					operation: 'claim',
					args: [
						{
							type: 'Hash160',
							value: scripthash,
						},
						{
							type: 'Integer',
							value: amount,
						},
						{
							type: 'Integer',
							value: nonce,
						},
						{
							type: 'Array',
							value: proof.map((v) => {
								return { type: 'Hash256', value: v }
							}),
						},
					],
				},
			],
			[{ scopes: WitnessScope.CalledByEntry }]
		)
		.then(({ result }) => {
			if (result.error) {
				convertWalletError(result.error)
				return '-1'
			}
			return result
		})
		.catch((error: DapiError) => {
			convertWalletError(error)
			return '-1'
		})
		.then(async (result: string) => {
			if (result === '-1') {
				return {
					status: 'error',
				}
			} else {
				const status = await getApplicationLog(result)
				return {
					status,
					txid: result,
				}
			}
		})
}

// 轮训获取日志
async function getApplicationLog(txid: string) {
	let status = ''
	let retryCount = 0
	while (true) {
		const fetchInitData = {
			method: 'POST',
			body: JSON.stringify({
				params: [txid],
				method: 'getapplicationlog',
				jsonrpc: '2.0',
				id: 1,
			}),
		}
		const network = window.location.search.indexOf('dev') >= 0 ? constants.TESTNET : constants.MAINNET
		await fetch(network, fetchInitData)
			.then((res) => res.json())
			.then((res) => res.result)
			.then((result: any) => {
				if (result?.executions?.[0]?.vmstate) {
					status = result.executions[0].vmstate === 'HALT' ? 'success' : 'error'
				} else {
					status = 'pending'
				}
			})
			.catch((error: DapiError) => {
				convertWalletError(error)
				status = 'catchErr'
			})
		if (status === 'catchErr' || status === 'pending') {
			await delay(10000 * 1.5 ** retryCount)
			retryCount += 1
			continue
		}
		break
	}
	return status
}

// 获取公钥
function getPublicKey() {
	return ''
}

async function disconnect(): Promise<void> {
	sessionStorage.removeItem(NEONWALLET_CONNECTED_KEY)
	sessionStorage.removeItem('connect')
	sessionStorage.removeItem('preConnectWallet')
	store.dispatch(batchUpdate({ address: '' }))
	try {
		await wcInstance.disconnect()
	} catch (e) {
		console.log(e)
	}
	location.reload()
}

// 钱包错误归总
function convertWalletError(error: DapiError) {
	switch (error.type) {
		case 'NO_PROVIDER':
			console.log('No provider available.')
			break
		case 'CONNECTION_DENIED':
			console.log('The user rejected the request to connect with your dApp')
			break
		case 'CONNECTION_REFUSED':
			console.log('The user rejected the request to connect with your dApp')
			break
		case 'RPC_ERROR':
			console.log('There was an error when broadcasting this transaction to the network.')
			break
		case 'MALFORMED_INPUT':
			console.log('The receiver address provided is not valid.')
			break
		case 'CANCELED':
			console.log('The user has canceled this transaction.')
			break
		case 'INSUFFICIENT_FUNDS':
			console.log('The user has insufficient funds to execute this transaction.')
			break
		case 'CHAIN_NOT_MATCH':
			console.log(
				'The currently opened chain does not match the type of the call chain, please switch the chain.'
			)
			break
		default:
			console.error(error)
			break
	}
}

// 新建proposal
const newProposal = (
	address: string,
	id: string,
	title: string,
	desc: string,
	scripthash: string,
	method: string,
	args: any[]
) => {
	const addressHash = `0x${wallet.getScriptHashFromAddress(address)}`
	return wcInstance
		?.invokeFunction(
			[
				{
					scriptHash: constants.BURGERGOV,
					operation: 'newProposal',
					args: [
						{
							type: 'Hash160',
							value: addressHash,
						},
						{
							type: 'String',
							value: title,
						},
						{
							type: 'String',
							value: desc,
						},
						{
							type: 'Integer',
							value: id,
						},
						{
							type: 'Hash160',
							value: scripthash,
						},
						{
							type: 'String',
							value: method,
						},
						{
							type: 'Array',
							value: args,
						},
					],
				},
			],
			[{ scopes: WitnessScope.CalledByEntry }]
		)
		.then(({ result }) => {
			if (result.error) {
				convertWalletError(result.error)
				return '-1'
			}
			return result
		})
		.catch((error: DapiError) => {
			convertWalletError(error)
			return '-1'
		})
		.then(async (result: string) => {
			if (result === '-1') {
				return {
					status: 'error',
				}
			} else {
				const status = await getApplicationLog(result)
				return {
					status,
					txid: result,
				}
			}
		})
}

// 投票
const vote = (address: string, id: string, forOrAgainst: boolean, unvote: boolean) => {
	const addressHash = `0x${wallet.getScriptHashFromAddress(address)}`
	return wcInstance
		?.invokeFunction(
			[
				{
					scriptHash: constants.BURGERGOV,
					operation: 'vote',
					args: [
						{
							type: 'Hash160',
							value: addressHash,
						},
						{
							type: 'Integer',
							value: id,
						},
						{
							type: 'Boolean',
							value: forOrAgainst,
						},
						{
							type: 'Boolean',
							value: unvote,
						},
					],
				},
			],
			[{ scopes: WitnessScope.CalledByEntry }]
		)
		.then(({ result }) => {
			if (result.error) {
				convertWalletError(result.error)
				return '-1'
			}
			return result
		})
		.catch((error: DapiError) => {
			convertWalletError(error)
			return '-1'
		})
		.then(async (result: string) => {
			if (result === '-1') {
				return {
					status: 'error',
				}
			} else {
				const status = await getApplicationLog(result)
				return {
					status,
					txid: result,
				}
			}
		})
}

export {
	initDapi,
	getAccount,
	getBalance,
	transfer,
	disconnect,
	getNetwork,
	getPublicKey,
	claimNoBug,
	newProposal,
	vote,
}
