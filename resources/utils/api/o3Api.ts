import _ from 'lodash-es'
import delay from 'delay'
import neo3Dapi from 'neo3-dapi'
import constants from '../../constants'
import { wallet } from '@cityofzion/neon-js'
import { store } from '@/store'
import { batchUpdate } from '@/store/features/burger'

interface AccountInfo {
	chainType: string
	address: string
	label?: string
}

interface Network {
	networks: string[]
	defaultNetwork: string
}

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

// 钱包初始化
const initDapi = () => {
	const onReady = _.once(async () => {
		neo3Dapi?.addEventListener(neo3Dapi.Constants.EventName.DISCONNECTED, () => {
			disconnect()
		})
		neo3Dapi?.addEventListener(neo3Dapi.Constants.EventName.ACCOUNT_CHANGED, (result: AccountInfo) => {
			store.dispatch(batchUpdate({ address: result.address }))
		})
		neo3Dapi?.addEventListener(neo3Dapi.Constants.EventName.NETWORK_CHANGED, (result: Network) => {
			store.dispatch(batchUpdate({ network: result.defaultNetwork }))
		})
		if (sessionStorage.getItem('preConnectWallet') === 'O3') {
			getAccount()
		}
	})
	neo3Dapi?.addEventListener(neo3Dapi.Constants.EventName.READY, () => {
		onReady()
	})
}

// 获取当前网络
function getNetwork(shouldUpdate?: boolean) {
	return neo3Dapi
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

// 获取账户（唤起钱包）
function getAccount() {
	neo3Dapi
		?.getAccount()
		.then((account: AccountInfo) => {
			getNetwork(true)
			sessionStorage.setItem('preConnectWallet', 'O3')
			store.dispatch(
				batchUpdate({
					walletName: 'O3',
					address: account.address,
				})
			)
		})
		.catch((error: DapiError) => convertWalletError(error))
}

// 获取资产
function getBalance() {
	const address = store.getState().burger.address
	neo3Dapi
		?.getBalance({
			params: [
				{
					address,
				},
			],
		})
		.then((result: { [addr: string]: BalanceResponse[] }) => {
			const balance: { [asset: string]: string } = {}
			result[address]?.forEach((v) => {
				balance[constants[v.symbol.toUpperCase()]] = v.amount
			})
			store.dispatch(batchUpdate({ balance }))
		})
		.catch((error: DapiError) => convertWalletError(error))
}

// 转换
async function transfer(scriptHash: string, amount: string) {
	const address = store.getState().burger.address
	return neo3Dapi
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
	return neo3Dapi
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
		await neo3Dapi
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
	return neo3Dapi
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
	return neo3Dapi
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
	return neo3Dapi
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
