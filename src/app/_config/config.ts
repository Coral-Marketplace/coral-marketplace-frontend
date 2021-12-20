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
    marketplaceContractAddress: '0xb17256c5EDFFd9afeb5d3674FCB68e4810a3C55d',
    loanContractAddress: '0x33E584cbc7711e060333DC734295F042b7C7D63C',
    nftContractAddress: '0x385F8e0cfde4fD696D4688FF21138A7A6464794b'
};

export const REEF_MAINNET: NetworkConfig = {
    testnet: false,
    rpcUrl: 'wss://rpc.reefscan.com/ws',
    marketplaceContractAddress: '0xDaADa3D7da9558cd1352cABcbCD3878bcD0Ec2D8',
    loanContractAddress: '0x7c32286CBc09f9D15D9350353e316c33Ce2bF71C',
    nftContractAddress: '0x5f3E142149EC338C46E65ba4455c9c1BEFa50DB1'
};


// ************* Request URLs *************************
export const BACKEND_URL = environment.backendUrl;
export const PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=reef-finance&vs_currencies=usd';


// ************* Strings *************************
export const SIGN_MESSAGE = 'Sign this nonce to authenticate in Coral Marketplace: ';
