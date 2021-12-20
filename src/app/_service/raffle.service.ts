import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { TypeItem } from '../_model/nft';
import { HttpClient } from '@angular/common/http';
import { Metadata } from '../_model/matadata';
import { ReefService } from './reef.service';
import { bigNumberToNumber, checkAccountAndClaim } from '../_utils/utils';
import { NftRaffle } from '../_model/raffle';
import { MarketItemService } from './market-item.service';

@Injectable({
  providedIn: 'root'
})
export class RaffleService {

constructor(private reefService: ReefService,
            private marketItemService: MarketItemService,
            private httpClient: HttpClient) { }


  async getRaffle(itemId: number): Promise<NftRaffle> {
		const item = await this.reefService.marketContract.connect(this.reefService.evmProvider).fetchItem(itemId);

    return this.mapRaffle(item, true);
	}

  async getOpenRaffles(): Promise<NftRaffle[]> {
		const allRaffles = await this.reefService.marketContract.connect(this.reefService.evmProvider).fetchRaffles();
    const openRaffles = allRaffles.filter((item: any) => item.onSale);

    return this.mapRaffles(openRaffles);
  }

  async getAddressOpenRaffles(address: String): Promise<NftRaffle[]> {
		const allRaffles = await this.reefService.marketContract.connect(this.reefService.evmProvider).fetchRaffles();
    const addressOpenRaffles = allRaffles.filter((item: any) => item.onSale && item.seller == address);

    return this.mapRaffles(addressOpenRaffles);
  }

  async createRaffle(itemId: number, numMinutes: number): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

    // Check if market contract has approval for selected address
    const marketApproved = await this.reefService.nftContract.connect(this.reefService.evmProvider)
      .isApprovedForAll(this.reefService.selectedSigner.evmAddress, this.reefService.marketContract.address);
    if (!marketApproved) {
      // Approve market contract for this address
      await this.reefService.nftContract.connect(this.reefService.selectedSigner.signer)
        .setApprovalForAll(this.reefService.marketContract.address, true);
    }

    const tx = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
      .createMarketItemRaffle(itemId, numMinutes);
    await tx.wait();

    return true;
  }


  async enterRaffle(itemId: number, amount: number): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
      .enterRaffle(itemId, { value: ethers.utils.parseUnits(amount.toString(), 'ether') });
		await tx.wait();

    return true;
	}


  async endRaffle(itemId: number): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
      .endRaffle(itemId);
		await tx.wait();

    return true;
	}


  private async mapRaffles(items: any): Promise<NftRaffle[]> {
    const raffles: NftRaffle[] = await Promise.all(items.map(async (item: any) => {
      return this.mapRaffle(item, false);
    }));
    
    return raffles;
  }

  
  async mapRaffle(item: any, withDetails: boolean): Promise<NftRaffle> {
    const nftContractWithProvider = this.reefService.nftContract.connect(this.reefService.evmProvider);
    
    let marketContractWithProvider;
    if (this.reefService.selectedSigner?.signer) {
      marketContractWithProvider = this.reefService.marketContract.connect(this.reefService.selectedSigner.signer);
    } else {
      marketContractWithProvider = this.reefService.marketContract.connect(this.reefService.evmProvider);
    }

    const raffleData = await marketContractWithProvider.fetchRaffleData(Number(item.itemId));

    let metadata: Metadata;
    let metadataUri = '';
    try {
      metadataUri = await nftContractWithProvider.tokenURI(item.tokenId);
      metadata = await this.httpClient.get<Metadata>(metadataUri).toPromise();
    } catch (error: any) {
      console.log(error);
      metadata = { name: '', description: '', imageURI: '', properties: []};
    }

    const raffle = new NftRaffle();
    raffle.deadline = new Date(Number(raffleData.deadline) * 1000);
    raffle.deadlineReached = raffle.deadline <= new Date();
    raffle.itemId = item.itemId;
    raffle.imageURI = metadata.imageURI;
    raffle.name = metadata.name;
  
    if (withDetails) {
      const itemSales = item.sales.map((sale: any) => {
        return { 
          seller: sale.seller, 
          buyer: sale.buyer,
          price: bigNumberToNumber(sale.price)
        };
      });

      raffle.seller = item.seller;
      raffle.owner = item.owner;
      raffle.creator = item.creator;
      raffle.onSale = item.onSale;
      raffle.description = metadata.description;
      raffle.properties = metadata.properties;
      raffle.typeItem = TypeItem.RAFFLE;
      raffle.sales = itemSales;

      const value = ethers.utils.parseUnits('100', 'ether');
      try {
        const royalties = await nftContractWithProvider.royaltyInfo(item.tokenId, value);
        raffle.royaltiesRecipient = royalties.receiver;
        raffle.royaltiesAmount = bigNumberToNumber(royalties.royaltyAmount);
      } catch (error) {
        console.log(error);
      }
      
      try {
        raffle.mutable = await nftContractWithProvider.hasMutableURI(item.tokenId);
      } catch(error) {
        console.log(error);
      }
    }

    try {
      const item = await this.marketItemService.getMarketItem(raffle.itemId).toPromise();
      raffle.collection = item.collection;
    } catch(error) { }

    return raffle;
  }

}

