(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[670],{8466:function(e,t,n){"use strict";n.r(t),n.d(t,{initDapi:function(){return m},getAccount:function(){return E},getBalance:function(){return S},transfer:function(){return A},disconnect:function(){return _},getNetwork:function(){return I},getPublicKey:function(){return R},claimNoBug:function(){return Z},newProposal:function(){return G},vote:function(){return P}});var r,a=n(266),s=n(809),o=n.n(s),u=n(7879),c=n.n(u),i=n(9316),p=n(4925),l=n(3881),f=n(8626),h=n(2538),d=n(8238),v=n(5780),y=n.n(v),g=n(794),w={},b="neo3:mainnet",x="NEONWALLET_CONNECTED";!function(e){e[e.None=0]="None",e[e.CalledByEntry=1]="CalledByEntry",e[e.CustomContracts=16]="CustomContracts",e[e.CustomGroups=32]="CustomGroups",e[e.Global=128]="Global"}(r||(r={}));var N=!1;function m(){return k.apply(this,arguments)}function k(){return(k=(0,a.Z)(o().mark((function e(){var t;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,i.ZP.init({projectId:"d8f33ca7b71a430ccdaa9fc03ea10277",relayUrl:"wss://relay.walletconnect.com",metadata:{name:"NeoBurger",description:"NeoBurger",url:location.href,icons:["https://".concat(location.host,"/logo.png")]}});case 2:return t=e.sent,w=new(c())(t),e.next=6,w.manageSession();case 6:if(N=!0,"Neon"!==sessionStorage.getItem("preConnectWallet")){e.next=10;break}return e.next=10,E();case 10:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function E(){return C.apply(this,arguments)}function C(){return(C=(0,a.Z)(o().mark((function e(){return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,w.loadSession();case 2:if(I(!0),w.session||!N){e.next=7;break}return e.next=6,w.connect(b);case 6:I(!0);case 7:sessionStorage.setItem(x,"true"),sessionStorage.setItem("preConnectWallet","Neon"),p.h.dispatch((0,l.w8)({walletName:"Neon",address:w.session&&w.getAccountAddress()?w.getAccountAddress():""}));case 10:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function S(){var e=p.h.getState().burger.address;(0,h.Xs)(e).then((function(e){var t,n={};null===e||void 0===e||null===(t=e.balance)||void 0===t||t.forEach((function(e){n[e.assethash]=f.Z[e.assethash]?new g.Z(e.amount).shiftedBy(f.Z[e.assethash]).toString():e.amount})),p.h.dispatch((0,l.w8)({balance:n}))})).catch((function(e){return F(e)}))}function I(e){return T.apply(this,arguments)}function T(){return(T=(0,a.Z)(o().mark((function e(t){var n;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!w.session){e.next=12;break}return e.next=3,w.getChainId();case 3:if(!((n=e.sent)&&n.indexOf("mainnet")>0)){e.next=9;break}return t&&p.h.dispatch((0,l.w8)({network:"N3MainNet"})),e.abrupt("return","N3MainNet");case 9:if(!(n&&n.indexOf("testnet")>0)){e.next=12;break}return t&&p.h.dispatch((0,l.w8)({network:"N3TestNet"})),e.abrupt("return","N3TestNet");case 12:return e.abrupt("return","");case 13:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function A(e,t){return O.apply(this,arguments)}function O(){return(O=(0,a.Z)(o().mark((function e(t,n){var s,u;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return u=p.h.getState().burger.address,e.abrupt("return",null===(s=w)||void 0===s?void 0:s.invokeFunction({invocations:[{scriptHash:t,operation:"transfer",args:[{type:"Address",value:u},{type:"Address",value:f.Z.TOADDRESS},{type:"Integer",value:n},{type:"Any",value:null}]}],signers:[{scopes:r.CalledByEntry}]}).then((function(e){return e})).catch((function(e){return F(e),"-1"})).then(function(){var e=(0,a.Z)(o().mark((function e(t){var n;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if("-1"!==t){e.next=4;break}return e.abrupt("return",{status:"error"});case 4:return e.next=6,B(t);case 6:return n=e.sent,e.abrupt("return",{status:n,txid:t});case 8:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}()));case 2:case"end":return e.stop()}}),e)})))).apply(this,arguments)}var Z=function(e,t,n,s){var u;return null===(u=w)||void 0===u?void 0:u.invokeFunction({invocations:[{scriptHash:f.Z.NOBUG,operation:"claim",args:[{type:"Hash160",value:e},{type:"Integer",value:t},{type:"Integer",value:n},{type:"Array",value:s.map((function(e){return{type:"Hash256",value:e}}))}]}],signers:[{scopes:r.CalledByEntry}]}).then((function(e){return e})).catch((function(e){return F(e),"-1"})).then(function(){var e=(0,a.Z)(o().mark((function e(t){var n;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if("-1"!==t){e.next=4;break}return e.abrupt("return",{status:"error"});case 4:return e.next=6,B(t);case 6:return n=e.sent,e.abrupt("return",{status:n,txid:t});case 8:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}())};function B(e){return H.apply(this,arguments)}function H(){return(H=(0,a.Z)(o().mark((function e(t){var n,r,a,s;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:n="",r=0;case 2:return a={method:"POST",body:JSON.stringify({params:[t],method:"getapplicationlog",jsonrpc:"2.0",id:1})},s=window.location.search.indexOf("dev")>=0?f.Z.TESTNET:f.Z.MAINNET,e.next=7,fetch(s,a).then((function(e){return e.json()})).then((function(e){return e.result})).then((function(e){var t,r;n=null!==e&&void 0!==e&&null!==(t=e.executions)&&void 0!==t&&null!==(r=t[0])&&void 0!==r&&r.vmstate?"HALT"===e.executions[0].vmstate?"success":"error":"pending"})).catch((function(e){F(e),n="catchErr"}));case 7:if("catchErr"!==n&&"pending"!==n){e.next=12;break}return e.next=10,y()(1e4*Math.pow(1.5,r));case 10:return r+=1,e.abrupt("continue",2);case 12:return e.abrupt("break",15);case 15:return e.abrupt("return",n);case 16:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function R(){return""}function _(){return D.apply(this,arguments)}function D(){return(D=(0,a.Z)(o().mark((function e(){return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return sessionStorage.removeItem(x),sessionStorage.removeItem("connect"),sessionStorage.removeItem("preConnectWallet"),p.h.dispatch((0,l.w8)({address:""})),e.prev=4,e.next=7,w.disconnect();case 7:e.next=12;break;case 9:e.prev=9,e.t0=e.catch(4),console.log(e.t0);case 12:location.reload();case 13:case"end":return e.stop()}}),e,null,[[4,9]])})))).apply(this,arguments)}function F(e){switch(e.type){case"NO_PROVIDER":console.log("No provider available.");break;case"CONNECTION_DENIED":case"CONNECTION_REFUSED":console.log("The user rejected the request to connect with your dApp");break;case"RPC_ERROR":console.log("There was an error when broadcasting this transaction to the network.");break;case"MALFORMED_INPUT":console.log("The receiver address provided is not valid.");break;case"CANCELED":console.log("The user has canceled this transaction.");break;case"INSUFFICIENT_FUNDS":console.log("The user has insufficient funds to execute this transaction.");break;case"CHAIN_NOT_MATCH":console.log("The currently opened chain does not match the type of the call chain, please switch the chain.");break;default:console.error(e)}}var G=function(e,t,n,s,u,c,i){var p,l="0x".concat(d.wallet.getScriptHashFromAddress(e));return null===(p=w)||void 0===p?void 0:p.invokeFunction({invocations:[{scriptHash:f.Z.BURGERGOV,operation:"newProposal",args:[{type:"Hash160",value:l},{type:"String",value:n},{type:"String",value:s},{type:"Integer",value:t},{type:"Hash160",value:u},{type:"String",value:c},{type:"Array",value:i}]}],signers:[{scopes:r.CalledByEntry}]}).then((function(e){return e})).catch((function(e){return F(e),"-1"})).then(function(){var e=(0,a.Z)(o().mark((function e(t){var n;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if("-1"!==t){e.next=4;break}return e.abrupt("return",{status:"error"});case 4:return e.next=6,B(t);case 6:return n=e.sent,e.abrupt("return",{status:n,txid:t});case 8:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}())},P=function(e,t,n,s){var u,c="0x".concat(d.wallet.getScriptHashFromAddress(e));return null===(u=w)||void 0===u?void 0:u.invokeFunction({invocations:[{scriptHash:f.Z.BURGERGOV,operation:"vote",args:[{type:"Hash160",value:c},{type:"Integer",value:t},{type:"Boolean",value:n},{type:"Boolean",value:s}]}],signers:[{scopes:r.CalledByEntry}]}).then((function(e){return e})).catch((function(e){return F(e),"-1"})).then(function(){var e=(0,a.Z)(o().mark((function e(t){var n;return o().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if("-1"!==t){e.next=4;break}return e.abrupt("return",{status:"error"});case 4:return e.next=6,B(t);case 6:return n=e.sent,e.abrupt("return",{status:n,txid:t});case 8:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}())}},5350:function(){},5883:function(){},8971:function(){},6601:function(){},9214:function(){},2480:function(){}}]);