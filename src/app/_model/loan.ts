import { ethers } from 'ethers';
import { NFT } from './nft';

export enum LoanState {
    OPEN, 
    BORROWED,
    REPAYED,
    LIQUIDATED,
    REMOVED
}

export class NftLoan extends NFT {
    loanId: number;
    borrower: string;
    loanAmount: ethers.BigNumber;
    loanAmountFormatted: number;
    feeAmount: ethers.BigNumber;
    feeAmountFormatted: number;
    minutesDuration: number;
    lender: string;
    repayByDate: Date | null;
    deadlineReached: boolean;
    state: LoanState;
}