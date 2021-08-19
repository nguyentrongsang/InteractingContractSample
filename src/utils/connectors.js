import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

const RPC_URL_1 =
	"https://mainnet.infura.io/v3/920d962b397d4646989aa594147ba78c";
const RPC_URL_42 =
	"https://kovan.infura.io/v3/920d962b397d4646989aa594147ba78c";
const RPC_URL_56 = "https://bsc-dataseed.binance.org";
const RPC_URL_97 = "https://data-seed-prebsc-1-s1.binance.org:8545";

const POLLING_INTERVAL = 12000;
export const RPC_URLS = {
	1: process.env.REACT_APP_RPC_URL_1 || RPC_URL_1,
	42: process.env.REACT_APP_RPC_URL_42 || RPC_URL_42,
	56: process.env.REACT_APP_RPC_URL_56 || RPC_URL_56,
	97: process.env.REACT_APP_RPC_URL_97 || RPC_URL_97,
};
export const NETWORKS = {
	matic: 137,
	mainnet: 56,
	testnet: 97,
	ropsten: 3,
	kovan: 42,
	rinkeby: 4,
	goerli: 5,
	ethereum: 1,
};

export const injected = new InjectedConnector({
	supportedChainIds: [
		NETWORKS["matic"],
		NETWORKS["mainnet"],
		NETWORKS["testnet"],
		NETWORKS["ropsten"],
		NETWORKS["rinkeby"],
		NETWORKS["goerli"],
		NETWORKS["kovan"],
		NETWORKS["ethereum"],
	],
});

export const walletlink = new WalletLinkConnector({
	url: RPC_URLS[97],
	appName: "yAI Finance",
});

export const walletconnect = new WalletConnectConnector({
	rpc: { 56: RPC_URLS[56] },
	bridge: "https://bridge.walletconnect.org",
	qrcode: true,
	pollingInterval: POLLING_INTERVAL,
});
