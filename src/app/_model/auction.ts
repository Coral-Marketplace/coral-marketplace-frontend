import { NFT } from './nft';
import { ethers } from 'ethers';

export class NftAuction extends NFT {
    numMinutes: number;
    deadline: Date;
    minBid: ethers.BigNumber;
    minBidFormatted: number;
    highestBidder: string;
    highestBid: ethers.BigNumber;
    highestBidFormatted: number;
    deadlineReached: boolean;
}