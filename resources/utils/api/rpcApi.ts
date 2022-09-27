import BigNumber from "bignumber.js";
import { wallet } from "@cityofzion/neon-js";
import constants from "../../constants";
import pRetry from "p-retry";

// 选择网络环境
const getNetwork = () => {
  return window.location.search.indexOf("dev") >= 0
    ? constants.TESTNET
    : constants.MAINNET;
};

// 选择备用网络环境
const getAlternateNetwork = () => {
  return window.location.search.indexOf("dev") >= 0
    ? constants.TESTNET
    : constants.MAINNET2;
};

const invokeFunc = (
  contractHash: string,
  method: string,
  params: any[],
  account?: string
) => {
  const paramsInfo = account
    ? [
        contractHash,
        method,
        params,
        [
          {
            account: account,
            scopes: "CalledByEntry",
            allowedcontracts: [],
            allowedgroups: [],
          },
        ],
      ]
    : [contractHash, method, params];
  const fetchInitData = {
    method: "POST",
    body: JSON.stringify({
      params: paramsInfo,
      method: "invokefunction",
      jsonrpc: "2.0",
      id: 1,
    }),
  };
  const retryFetch = async () => {
    const response = await fetch(getNetwork(), fetchInitData);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  };
  return pRetry(retryFetch, { retries: 2 })
    .then((res) => res.result)
    .catch((err) => {
      console.log(err);
      return fetch(getAlternateNetwork(), fetchInitData)
        .then((res) => res.json())
        .then((res) => res.result)
        .catch((err) => console.log(err));
    });
};

const invokeScript = (script: string, account?: string) => {
  const paramsInfo = account
    ? [
        script,
        [
          {
            account: account,
            scopes: "CalledByEntry",
            allowedcontracts: [],
            allowedgroups: [],
          },
        ],
      ]
    : [script];
  const fetchInitData = {
    method: "POST",
    body: JSON.stringify({
      params: paramsInfo,
      method: "invokescript",
      jsonrpc: "2.0",
      id: 1,
    }),
  };
  const retryFetch = async () => {
    const response = await fetch(getNetwork(), fetchInitData);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  };
  return pRetry(retryFetch, { retries: 2 })
    .then((res) => res.result)
    .catch((err) => {
      console.log(err);
      return fetch(getAlternateNetwork(), fetchInitData)
        .then((res) => res.json())
        .then((res) => res.result)
        .catch((err) => console.log(err));
    });
};

// 所有人一共转换的bNEO数量
const getTotalSupply = () => {
  return invokeFunc(constants.BNEO, "totalSupply", []);
};

// 个人没有claimed的gas数量
const getUnclaimedGAS = (address: string) => {
  const scriptHash = `0x${wallet.getScriptHashFromAddress(address)}`;
  return invokeFunc(constants.BNEO, "reward", [
    { type: "Hash160", value: scriptHash },
  ]);
};

// 获取至今每个neo获取的gas数
const getRewardsPerNEO = () => {
  return invokeFunc(constants.BNEO, "rPS", []);
};

// 获取资产数量
const getBalance = (asset: string, scripthash: string) => {
  return invokeFunc(asset, "balanceOf", [
    { type: "Hash160", value: scripthash },
  ]);
};

// 转账
const transfer = (contractHash: string, address: string, amount: string) => {
  const fromAddressHash = `0x${wallet.getScriptHashFromAddress(address)}`;
  const toAddressHash = `0x${wallet.getScriptHashFromAddress(
    constants.TOADDRESS
  )}`;
  const params = [
    { type: "Hash160", value: fromAddressHash },
    { type: "Hash160", value: toAddressHash },
    { type: "Integer", value: new BigNumber(amount).shiftedBy(8) },
    { type: "Any", value: null },
  ];
  return invokeFunc(contractHash, "transfer", params, fromAddressHash);
};

const mint = (address: string, amount: string) => {
  return transfer(constants.NEO, address, amount);
};

const redeem = (address: string, amount: string) => {
  return transfer(constants.GAS, address, amount);
};

const claim = (address: string) => {
  return transfer(constants.BNEO, address, "0");
};

// 获取NEO、GAS对应usdt单价
const getQuote = () => {
  //   return fetch("https://onegate.space/api/quote?convert=usd", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify([constants.NEO, constants.GAS]),
  //   })
  //     .then((res) => res.json())
  //     .then((res) => res)
  //     .catch(() => {
  //       console.log("Failed to get the unit price of the asset");
  //     });
  return Promise.all([
    invokeScript(constants.NEOPRICE).then(
      (res) => res.stack[0].value[1].value / 10 ** 6
    ),
    invokeScript(constants.GASPRICE).then(
      (res) => res.stack[0].value[2].value / 10 ** 6
    ),
  ]).catch(() => {
    console.log("Failed to get the unit price of the asset");
  });
};

// 每个NEO每秒的NEO收益
async function burgerGasPerNeoPerSecond() {
  const block = await getCurrentBlockHeight();
  if (!block) {
    return "";
  }
  const start = `https://neoburger.blob.core.windows.net/data/${
    block - 8192
  }.json`;
  const stop = `https://neoburger.blob.core.windows.net/data/${
    block - 8192 - 131072
  }.json`;
  const retryFetch = async () => {
    const response = await Promise.all([
      fetch(start, { method: "GET" }),
      fetch(stop, { method: "GET" }),
    ]);
    if (!response[0].ok) {
      throw new Error(response[0].statusText);
    }
    if (!response[1].ok) {
      throw new Error(response[1].statusText);
    }
    return response;
  };
  const resp = await pRetry(retryFetch, { retries: 2 }).catch(async (err) => {
    console.log(err);
    const start2 = `https://raw.githubusercontent.com/neoburger/statistics/data/data/${
      block - 8192
    }.json`;
    const stop2 = `https://raw.githubusercontent.com/neoburger/statistics/data/data/${
      block - 8192 - 131072
    }.json`;
    return await Promise.all([
      fetch(start2, { method: "GET" }),
      fetch(stop2, { method: "GET" }),
    ]).catch((err) => {
      console.log(err);
      return null;
    });
  });
  if (!resp) {
    return "";
  }
  const [jx, jy] = await Promise.all(
    resp.map((v) => {
      return v.json();
    })
  ).catch((err) => {
    console.log(err);
    return [null, null];
  });
  if (!jx || !jy) {
    return "";
  }
  const drps = jx.rps - jy.rps;
  const dtime = jx.timestamp - jy.timestamp;
  return (drps * 1000) / dtime;
}

// 获取当前区块高度
const getCurrentBlockHeight = () => {
  const fetchInitData = {
    method: "POST",
    body: JSON.stringify({
      params: [],
      method: "getblockcount",
      jsonrpc: "2.0",
      id: 1,
    }),
  };
  const retryFetch = async () => {
    const response = await fetch(getNetwork(), fetchInitData);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  };
  return pRetry(retryFetch, { retries: 2 })
    .then((res) => res.result)
    .catch((err) => {
      console.log(err);
      return fetch(getAlternateNetwork(), fetchInitData)
        .then((res) => res.json())
        .then((res) => res.result)
        .catch((err) => {
          console.log(err);
          return null;
        });
    });
};

// 获取对应块上burger的数据
const getBlockBurgerInfo = (blockIndex: string) => {
  const retryFetch = async () => {
    const response = await fetch(
      `https://neoburger.blob.core.windows.net/data/${blockIndex}.json`,
      { method: "GET" }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  };
  return pRetry(retryFetch, { retries: 2 }).catch((err) => {
    console.log(err);
    return fetch(
      `https://raw.githubusercontent.com/neoburger/statistics/data/data/${blockIndex}.json`,
      { method: "GET" }
    )
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
        return null;
      });
  });
};

// 获取账户状态
const getAccountState = (asset: string, agenthash: string) => {
  return invokeFunc(asset, "getAccountState", [
    { type: "Hash160", value: agenthash },
  ]);
};

// 获取代理人信息
const getAgentInfo = () => {
  return invokeScript(constants.SCRIPTAGENT);
};

//  获取委员会所有信息
const getCommitteeDetail = () => {
  return invokeFunc(constants.COMMITTEEINFO, "getAllInfo", []);
};

// 获取所有理事会成员信息（包含曾经成为过的）
const getCommitteeInfo = () => {
  const fetchInitData = {
    method: "POST",
    body: JSON.stringify({
      params: [],
      method: "getcommittee",
      jsonrpc: "2.0",
      id: 1,
    }),
  };
  const retryFetch = async () => {
    const response = await fetch(getNetwork(), fetchInitData);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  };
  return pRetry(retryFetch, { retries: 2 })
    .then((res) => res.result)
    .catch((err) => {
      console.log(err);
      return fetch(getAlternateNetwork(), fetchInitData)
        .then((res) => res.json())
        .then((res) => res.result)
        .catch((err) => {
          console.log(err);
          return null;
        });
    });
};

// 获取某样资产信息
const getAssetInfoByContractHash = (contractHash: string) => {
  const fetchInitData = {
    method: "POST",
    body: JSON.stringify({
      params: { ContractHash: contractHash },
      method: "GetAssetInfoByContractHash",
      jsonrpc: "2.0",
      id: 1,
    }),
  };
  const retryFetch = async () => {
    const response = await fetch(getNetwork(), fetchInitData);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  };
  return pRetry(retryFetch, { retries: 2 })
    .then((res) => res.result)
    .catch((err) => {
      console.log(err);
      return fetch(getAlternateNetwork(), fetchInitData)
        .then((res) => res.json())
        .then((res) => res.result)
        .catch((err) => {
          console.log(err);
          return null;
        });
    });
};

// 获取候选人列表
const getCandidates = () => {
  return invokeFunc(constants.NEO, "getCandidates", []);
};

// 获取NoBug总数
const getTotalNoBug = () => {
  return invokeFunc(constants.NOBUG, "totalSupply", []);
};

// 获取nobug信息
const getNoBugInfo = () => {
  const fetchInitData = {
    method: "GET",
    headers: {
      Network:
        window.location.search.indexOf("dev") >= 0 ? "testnet" : "mainnet",
    },
  };
  return fetch(
    `https://api.neotube.io/v1/asset/${constants.NOBUG}`,
    fetchInitData
  )
    .then((res) => res.json())
    .catch((err) => {
      console.log(err);
      return null;
    });
};

// nobug是否已经领取
const nobugIsClaimed = (
  scripthash: string,
  amount: string,
  nonce: string,
  proof: string[]
) => {
  return invokeFunc(constants.NOBUG, "claim", [
    {
      type: "Hash160",
      value: scripthash,
    },
    {
      type: "Integer",
      value: amount,
    },
    {
      type: "Integer",
      value: nonce,
    },
    {
      type: "Array",
      value: proof.map((v) => {
        return { type: "Hash256", value: v };
      }),
    },
  ]);
};

// 获取nep17资产
const getNep17Balance = (address: string) => {
  const fetchInitData = {
    method: "POST",
    body: JSON.stringify({
      params: [address],
      method: "getnep17balances",
      jsonrpc: "2.0",
      id: 1,
    }),
  };
  const retryFetch = async () => {
    const response = await fetch(getNetwork(), fetchInitData);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  };
  return pRetry(retryFetch, { retries: 2 })
    .then((res) => res.result)
    .catch((err) => {
      console.log(err);
      return fetch(getAlternateNetwork(), fetchInitData)
        .then((res) => res.json())
        .then((res) => res.result)
        .catch((err) => {
          console.log(err);
          return null;
        });
    });
};

// 获取proposal最近一次的id
const getLatestProposalID = () => {
  return invokeFunc(constants.BURGERGOV, "getLatestProposalID", []);
};

// 获取proposal详情
const getProposalDetail = (id: string) => {
  return invokeFunc(constants.BURGERGOV, "proposalAttributes", [
    {
      type: "Integer",
      value: id,
    },
  ]);
};

// 获取投票状态
const getVoteStatus = (address: string, id: string) => {
  const addressHash = `0x${wallet.getScriptHashFromAddress(address)}`;
  return invokeFunc(constants.BURGERGOV, "getVote", [
    {
      type: "Hash160",
      value: addressHash,
    },
    {
      type: "Integer",
      value: id,
    },
  ]);
};

// 获取投票状态
const votee = (
  address: string,
  id: string,
  forOrAgainst: string,
  unvote: string
) => {
  const addressHash = `0x${wallet.getScriptHashFromAddress(address)}`;
  return invokeFunc(
    constants.BURGERGOV,
    "vote",
    [
      {
        type: "Hash160",
        value: addressHash,
      },
      {
        type: "Integer",
        value: id,
      },
      {
        type: "Integer",
        value: forOrAgainst,
      },
      {
        type: "Integer",
        value: unvote,
      },
    ],
    addressHash
  );
};

export {
  getTotalSupply,
  getUnclaimedGAS,
  getQuote,
  mint,
  redeem,
  claim,
  getRewardsPerNEO,
  burgerGasPerNeoPerSecond,
  getCurrentBlockHeight,
  getBlockBurgerInfo,
  getAgentInfo,
  getBalance,
  getAccountState,
  getCommitteeDetail,
  getAssetInfoByContractHash,
  getCandidates,
  getCommitteeInfo,
  getTotalNoBug,
  getNoBugInfo,
  nobugIsClaimed,
  getNep17Balance,
  getLatestProposalID,
  getProposalDetail,
  getVoteStatus,
  votee,
};
