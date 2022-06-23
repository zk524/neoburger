import { rpc, sc, tx, u, wallet } from '@cityofzion/neon-js';
import constants from '../../constants';
import { walletApi } from './walletApi';
import pRetry from 'p-retry';

// 选择网络环境
const getNetwork = () => {
    return window.location.search.indexOf('dev') >= 0 ? constants.TESTNET : constants.MAINNET;
}

// 选择备用网络环境
const getAlternateNetwork = () => {
    return window.location.search.indexOf('dev') >= 0 ? constants.TESTNET : constants.MAINNET2;
}

// 获取网络费
const getNetworkFee = async (scriptHash: string, address: string, amount: string, walletName: string) => {
    const fromAddressHash = `0x${wallet.getScriptHashFromAddress(address)}`;
    const toAddressHash = `0x${wallet.getScriptHashFromAddress(constants.TOADDRESS)}`;
    const invocation = {
        scriptHash,
        operation: 'transfer',
        args: [
            sc.ContractParam.fromJson({ type: "Hash160", value: fromAddressHash }),
            sc.ContractParam.fromJson({ type: "Hash160", value: toAddressHash }),
            sc.ContractParam.fromJson({ type: "Integer", value: amount }),
            sc.ContractParam.fromJson({ type: "Any", value: null })
        ]
    }
    const txSigners = [{ account: fromAddressHash, scopes: 'CalledByEntry', allowedcontracts: [], allowedgroups: [] }];
    const script = sc.createScript(invocation);
    const rpcClient = new rpc.RPCClient(getNetwork());
    const currentHeight = await rpcClient.getBlockCount();
    const publicKey = await walletApi[walletName]?.getPublicKey();
    if (!publicKey) {
        return '0'
    }
    const transaction = new tx.Transaction({
        signers: txSigners,
        validUntilBlock: currentHeight + 5000,
        script: script,
        witnesses: [
            {
                invocationScript: '',
                verificationScript: wallet.getVerificationScriptFromPublicKey(publicKey),
            },
        ]
    });
    const fetchInitData = {
        method: 'POST',
        body: JSON.stringify({
            params: [u.HexString.fromHex(transaction.serialize(true)).toBase64()],
            method: 'calculatenetworkfee',
            jsonrpc: '2.0',
            id: 1
        })
    };
    const retryFetch = async () => {
        const response = await fetch(getNetwork(), fetchInitData);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response?.json();
    }
    return pRetry(retryFetch, { retries: 2 }).then((res) => res?.result?.networkfee).catch((err) => {
        console.log(err);
        return fetch(getAlternateNetwork(), fetchInitData).then((res) => res?.json()).then((res) => res?.result?.networkfee).catch((err) => {
            console.log(err);
        });
    });
};

export default getNetworkFee;