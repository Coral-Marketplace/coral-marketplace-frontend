import { NetworkConfig } from 'src/app/_model/networkConfig';
import { environment } from 'src/environments/environment';

// *********** Locale configs *******************
export class LocaleConfiguration {
    fallbackLocale: string;
    availableLanguages: string[];
}

export const LOCALE_CONFIG: LocaleConfiguration = {
    fallbackLocale: 'en',
    availableLanguages: ['en']
};


// *********** IPFS configs *******************
export const IPFS_API_URL = 'https://ipfs.infura.io:5001/api/v0';
export const IPFS_PREFIX_URL = 'https://ipfs.infura.io/ipfs/';


// *********** Network configs *******************
export const REEF_TESTNET: NetworkConfig = {
    testnet: true,
    rpcUrl: 'wss://rpc-testnet.reefscan.com/ws',
    marketplaceContractAddress: '0x17b1C987520dE98B85c9cF9c8cE92333228034Bb',
    loanContractAddress: '0xC8e7e2F541D1BED81d70D4f216b7D06A688E53a8',
    nftContractAddress: '0x02C7921BaB3054FCcd62c987aeB7d303D66b300E'
};

export const REEF_MAINNET: NetworkConfig = {
    testnet: false,
    rpcUrl: 'wss://rpc.reefscan.com/ws',
    marketplaceContractAddress: '0x79a46FCDAF4989960219843989dAC9FAf35d3489',
    loanContractAddress: '0xB9EfC4Eb306e2BDD1F21246B7e2CEE075dDf1663',
    nftContractAddress: '0xa12b4607090E8dB9F1F7B07754eEf89A493cF746'
};


// ************* Request URLs *************************
export const BACKEND_URL = environment.backendUrl;
export const PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=reef-finance&vs_currencies=usd';


// ************* Strings *************************
export const SIGN_MESSAGE = 'Sign this nonce to authenticate in Coral Marketplace: ';
