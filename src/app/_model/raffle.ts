import { NFT } from './nft';

export class NftRaffle extends NFT {
    numMinutes: number;
    deadline: Date;
    deadlineReached: boolean;
}