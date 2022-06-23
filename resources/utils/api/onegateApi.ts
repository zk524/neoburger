import _ from 'lodash-es'
import delay from 'delay'
import { NeoDapi } from '@neongd/neo-dapi'
import constants from '../../constants'
import { wallet } from '@cityofzion/neon-js'
import { store } from '@/store'
import { batchUpdate } from '@/store/features/burger'
import BigNumber from 'bignumber.js'

interface AccountInfo {
	publicKey: string
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
	assetHash: string
	amount: string
}

interface TransferResponse {
	txid: string
	nodeURL?: string
	signedTx?: string
}

let neo3Dapi: NeoDapi | null = null

// 钱包初始化
const initDapi = () => {
	if (window.OneGate) {
		neo3Dapi = new NeoDapi(window.OneGate)
		getAccount()
		window.OneGate.on('disconnect', () => {
			disconnect()
		})
	}
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
			store.dispatch(
				batchUpdate({
					walletName: 'OneGate',
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
		?.getNep17Balances({ address })
		.then((result: BalanceResponse[]) => {
			const balance: { [asset: string]: string } = {}
			result?.forEach((v) => {
				if (constants[v.assetHash] !== undefined) {
					balance[v.assetHash] = new BigNumber(v.amount).shiftedBy(constants[v.assetHash]).toString()
				}
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
					type: 'Hash160',
					value: `0x${wallet.getScriptHashFromAddress(address)}`,
				},
				{
					type: 'Hash160',
					value: `0x${wallet.getScriptHashFromAddress(constants.TOADDRESS)}`,
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
			signers: [
				{
					account: `0x${wallet.getScriptHashFromAddress(address)}`,
					scopes: 'CalledByEntry',
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
			signers: [
				{
					account: scripthash,
					scopes: 'CalledByEntry',
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
				if (result?.executions?.[0]?.vmState) {
					status = result.executions[0].vmState === 'HALT' ? 'success' : 'error'
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
		?.getAccount()
		.then((account: AccountInfo) => {
			return account?.publicKey || ''
		})
		.catch((error: DapiError) => {
			convertWalletError(error)
			return ''
		})
}

// 断开连接
function disconnect() {
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
			signers: [
				{
					account: addressHash,
					scopes: 'CalledByEntry',
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
			signers: [
				{
					account: addressHash,
					scopes: 'CalledByEntry',
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
