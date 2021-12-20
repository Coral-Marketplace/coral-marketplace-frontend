import { ethers } from 'ethers';
import { Collection } from './collection';

export enum TypeItem {
    REGULAR, 
    AUCTION,
    RAFFLE,
    LOAN,
    NONE
}

export class NftProperty {
    name: string;
    value: string;
}

export class Sale {
    seller: string;
    buyer: string;
    price: number;
    dollarPrice?: number;
}

export class NFT {
    itemId: number;
    tokenId: number;
    price: ethers.BigNumber;
    priceFormatted: number;
    seller: string;
    owner: string;
    creator: string;
    onSale: boolean;
    marketFee: number;
    sales: Sale[];
    metadataURI: string;
    imageURI: string;
    name: string;
    description: string;
    properties: NftProperty[];
    typeItem: TypeItem;
    royaltiesRecipient?: string;
    royaltiesAmount?: number;
    dollarPrice?: number;
    mutable?: boolean;
    collection?: Collection;
    
    constructor() {
        this.royaltiesAmount = 0;
        this.properties = [];
    }
}