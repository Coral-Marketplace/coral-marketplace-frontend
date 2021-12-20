import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { LoanState, NftLoan } from '../_model/loan';
import { Metadata } from '../_model/matadata';
import { TypeItem } from '../_model/nft';
import { bigNumberToNumber, checkAccountAndClaim } from '../_utils/utils';
import { MarketService } from './market.service';
import { ReefService } from './reef.service';
import { MarketItemService } from './market-item.service';

@Injectable({
  providedIn: 'root'
})
export class LoanService {

  constructor(private reefService: ReefService,
              private marketService: MarketService,
              private marketItemService: MarketItemService,
              private httpClient: HttpClient) { }   

  async getLoan(loanId: number): Promise<NftLoan> {
		const loan = await this.reefService.loanContract
      .connect(this.reefService.evmProvider).fetch(loanId);

    return this.mapLoan(loan);
	}

  async getLoans(state: LoanState): Promise<NftLoan[]> {
		const allLoans = await this.reefService.loanContract
      .connect(this.reefService.evmProvider).fetchAll();

    const filteredLoans = allLoans.filter((loan: any) => loan.state == state);

    return this.mapLoans(filteredLoans);
  }

  async getAddressOpenLoans(address: string): Promise<NftLoan[]> {
		const allLoans = await this.reefService.loanContract
      .connect(this.reefService.evmProvider).fetchAll();

    const filteredLoans = allLoans.filter((loan: any) => 
      loan.state == LoanState.OPEN && loan.borrower == address);

    return this.mapLoans(filteredLoans);
  }

  async getAddressActiveLoans(address: string): Promise<NftLoan[]> {
		const allLoans = await this.reefService.loanContract
      .connect(this.reefService.evmProvider).fetchAll();

    const filteredLoans = allLoans.filter((loan: any) => 
      loan.state == LoanState.BORROWED && (loan.borrower == address || loan.lender == address));

    return this.mapLoans(filteredLoans);
  }

  async createLoan(itemId: number, loanAmount: number, feeAmount: number, minutes: number): Promise<number> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

    // Check if loan contract has approval for selected address
    const loanContractApproved = await this.reefService.nftContract.connect(this.reefService.evmProvider)
      .isApprovedForAll(this.reefService.selectedSigner.evmAddress, this.reefService.loanContract.address);
    if (!loanContractApproved) {
      // Approve loan contract for this address
      await this.reefService.nftContract.connect(this.reefService.selectedSigner.signer)
        .setApprovalForAll(this.reefService.loanContract.address, true);
    }

		const tx = await this.reefService.loanContract.connect(this.reefService.selectedSigner.signer)
      .create(itemId, ethers.utils.parseUnits(loanAmount.toString(), 'ether'), 
      ethers.utils.parseUnits(feeAmount.toString(), 'ether'), minutes);
		const receipt = await tx.wait();
		const loanId = receipt.events[2].args[0].toNumber();    

    return loanId;
	}

  async fundLoan(loan: NftLoan): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.loanContract.connect(this.reefService.selectedSigner.signer)
      .fund(loan.loanId, {value: loan.loanAmount });
		await tx.wait();

    return true;
	}

  async repayLoan(loan: NftLoan): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.loanContract.connect(this.reefService.selectedSigner.signer)
      .repay(loan.loanId, {value: loan.loanAmount.add(loan.feeAmount) });
		await tx.wait();

    return true;
	}

  async liquidateLoan(loanId: number): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.loanContract.connect(this.reefService.selectedSigner.signer)
      .liquidate(loanId);
		await tx.wait();

    return true;
	}

  async unlistLoan(loanId: number): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.loanContract.connect(this.reefService.selectedSigner.signer)
      .unlist(loanId);
    await tx.wait();

    return true;
	}

  private async mapLoans(items: any): Promise<NftLoan[]> {
    const loans: NftLoan[] = await Promise.all(items.map(async (item: any) => {
      return this.mapLoan(item);
    }));
    
    return loans;
  }

  private async mapLoan(item: any): Promise<NftLoan> {
    const nftContractWithProvider = this.reefService.nftContract.connect(this.reefService.evmProvider);

    let metadata: Metadata;
    let metadataUri = '';
    try {
      metadataUri = await nftContractWithProvider.tokenURI(item.tokenId);
      metadata = await this.httpClient.get<Metadata>(metadataUri).toPromise();
    } catch (error: any) {
      console.log(error);
      metadata = { name: '', description: '', imageURI: '', properties: []};
    }

    const timestamp = Number(item.repayByTimestamp);

    const loan = new NftLoan();
    loan.loanId = Number(item.loanId);
    loan.loanAmountFormatted = bigNumberToNumber(item.loanAmount);
    loan.feeAmountFormatted = bigNumberToNumber(item.feeAmount);
    loan.minutesDuration = Number(item.minutesDuration);
    loan.repayByDate = timestamp ? new Date(Number(item.repayByTimestamp) * 1000) : null;
    loan.deadlineReached = !!loan.repayByDate && loan.repayByDate <= new Date();
    loan.itemId = item.itemId;
    loan.imageURI = metadata.imageURI;
    loan.name = metadata.name;
    loan.borrower = item.borrower;
    loan.lender = item.lender;
    loan.loanAmount = item.loanAmount;
    loan.feeAmount = item.feeAmount;
    loan.state = item.state;
    loan.typeItem = TypeItem.LOAN;    

    try {
      const item = await this.marketItemService.getMarketItem(loan.itemId).toPromise();
      loan.collection = item.collection;
    } catch(error) { }

    return loan;
  }

}

