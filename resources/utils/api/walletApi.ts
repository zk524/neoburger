interface WalletApi {
    Neoline: typeof import('./neolineApi') | null,
    NeolineMobile: typeof import('./neolineMobileApi') | null,
    O3: typeof import('./o3Api') | null,
    OneGate: typeof import('./onegateApi') | null,
    Neon: typeof import('./neonApi') | null,
}

let walletApi: WalletApi = {
    Neoline: null,
    NeolineMobile: null,
    O3: null,
    OneGate: null,
    Neon: null
}

// 初始化所有钱包module
const initWalletApi = async () => {
    import('./neolineApi').then((res) => {
        walletApi.Neoline = res;
        res.initDapi();
    });
    import('./neolineMobileApi').then((res) => {
        walletApi.NeolineMobile = res;
        res.initDapi();
    });
    import('./o3Api').then((res) => {
        walletApi.O3 = res;
        res.initDapi();
    });
    import('./onegateApi').then((res) => {
        walletApi.OneGate = res;
        res.initDapi();
    });
    import('./neonApi').then((res) => {
        walletApi.Neon = res;
        res.initDapi();
    });
}

export {
    initWalletApi,
    walletApi
};
