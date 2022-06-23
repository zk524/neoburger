import _ from 'lodash-es'
import delay from 'delay'
import constants from '../../constants'
import { wallet } from '@cityofzion/neon-js'
import { store } from '@/store'
import { batchUpdate } from '@/store/features/burger'

let neoline: any // dapi句柄
let neolineN3: any // dapi句柄N3版

interface DapiError {
	type: string
	description: string
	data: string
}

interface BalanceResponse {
	symbol: string
	amount: string
	contract: string
}

interface TransferResponse {
	txid: string
	nodeURL?: string
	signedTx?: string
}

interface PublicKeyResponse {
	address: string
	publicKey: string
}

interface AccountInfo {
	address: string
	label?: string
}

interface Network {
	networks: string[]
	chainId: number
	defaultNetwork: string
}

// 钱包初始化
const initDapi = () => {
	const onReady = _.once(async () => {
		if (!neoline || !neolineN3) {
			neoline = new window.NEOLine.Init()
			neolineN3 = new window.NEOLineN3.Init()
		}
		neoline?.addEventListener(neoline.EVENT.DISCONNECTED, () => {
			disconnect()
		})
		neoline?.addEventListener(neoline.EVENT.ACCOUNT_CHANGED, (result: AccountInfo) => {
			store.dispatch(batchUpdate({ address: result.address }))
		})
		neoline?.addEventListener(neoline.EVENT.NETWORK_CHANGED, (result: Network) => {
			store.dispatch(batchUpdate({ network: result.defaultNetwork }))
		})
		if (sessionStorage.getItem('connect') === 'true' && sessionStorage.getItem('preConnectWallet') === 'Neoline') {
			getAccount()
		}
	})
	if (window.NEOLine && window.NEOLineN3) {
		onReady()
		return
	}
	window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
		if (window.NEOLine && window.NEOLineN3) {
			onReady()
		}
	})
	window.addEventListener('NEOLine.N3.EVENT.READY', () => {
		if (window.NEOLine && window.NEOLineN3) {
			onReady()
		}
	})
}

// 获取账户（唤起钱包）
function getAccount() {
	neoline
		?.getAccount()
		.then((account: AccountInfo) => {
			getNetwork(true)
			sessionStorage.setItem('preConnectWallet', 'Neoline')
			store.dispatch(
				batchUpdate({
					walletName: 'Neoline',
					address: account.address,
				})
			)
		})
		.catch((error: DapiError) => convertWalletError(error))
}

// 获取资产
function getBalance() {
	const address = store.getState().burger.address
	neolineN3
		?.getBalance()
		.then((result: { [addr: string]: BalanceResponse[] }) => {
			const balance: { [asset: string]: string } = {}
			result[address]?.forEach((v) => {
				balance[constants[v.symbol.toUpperCase()]] = v.amount
			})
			store.dispatch(batchUpdate({ balance }))
		})
		.catch((error: DapiError) => convertWalletError(error))
}

// 获取当前网络
function getNetwork(shouldUpdate?: boolean) {
	return neoline
		?.getNetworks()
		.then((result: Network) => {
			shouldUpdate && store.dispatch(batchUpdate({ network: result.defaultNetwork }))
			return result.defaultNetwork
		})
		.catch((error: DapiError) => {
			convertWalletError(error)
			return ''
		})
}

// 转换
async function transfer(scriptHash: string, amount: string) {
	const address = store.getState().burger.address
	return neolineN3
		?.invoke({
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
					value: null,
				},
			],
			fee: '0',
			broadcastOverride: false,
			signers: [
				{
					account: `0x${wallet.getScriptHashFromAddress(address)}`,
					scopes: 1,
				},
			],
		})
		.then((result: TransferResponse) => {
			return result.txid
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
	return neolineN3
		?.invoke({
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
			fee: '0',
			broadcastOverride: false,
			signers: [
				{
					account: scripthash,
					scopes: 1,
				},
			],
		})
		.then((result: TransferResponse) => {
			return result.txid
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
		await neolineN3
			?.getApplicationLog({
				txid,
			})
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
	return neoline
		?.getPublicKey()
		.then((publicKeyData: PublicKeyResponse) => {
			return publicKeyData?.publicKey || ''
		})
		.catch((error: DapiError) => {
			convertWalletError(error)
			return ''
		})
}

// 断开连接
function disconnect() {
	sessionStorage.removeItem('connect')
	sessionStorage.removeItem('preConnectWallet')
	store.dispatch(batchUpdate({ address: '' }))
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
	return neolineN3
		?.invoke({
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
			fee: '0',
			broadcastOverride: false,
			signers: [
				{
					account: addressHash,
					scopes: 1,
				},
			],
		})
		.then((result: TransferResponse) => {
			return result.txid
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
	return neolineN3
		?.invoke({
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
			fee: '0',
			broadcastOverride: false,
			signers: [
				{
					account: addressHash,
					scopes: 1,
				},
			],
		})
		.then((result: TransferResponse) => {
			return result.txid
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
