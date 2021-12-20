import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { TypeItem } from '../_model/nft';
import { HttpClient } from '@angular/common/http';
import { Metadata } from '../_model/matadata';
import { ReefService } from './reef.service';
import { bigNumberToNumber, checkAccountAndClaim } from '../_utils/utils';
import { NftAuction } from '../_model/auction';
import { MarketItemService } from './market-item.service';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {

constructor(private reefService: ReefService,
            private marketItemService: MarketItemService,
            private httpClient: HttpClient) { }

  async getAuction(itemId: number): Promise<NftAuction> {
		const item = await this.reefService.marketContract.connect(this.reefService.evmProvider).fetchItem(itemId);

    return this.mapAuction(item, true);
	}

  async getAddressBids(address: string): Promise<NftAuction[]> {
		const rawAuctions = await this.reefService.marketContract.connect(this.reefService.evmProvider).fetchAuctions();
    
    const auctions: NftAuction[] = await this.mapAuctions(rawAuctions);
    
    return auctions.filter((auction: NftAuction) => auction.highestBidder == address);
  }

  async createAuction(itemId: number, numMinutes: number, minBid: number): Promise<boolean> {
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
      .createMarketItemAuction(itemId, numMinutes, ethers.utils.parseUnits(minBid.toString(), 'ether'));
    await tx.wait();

    return true;
  }

  async createBid(itemId: number, amount: number): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
      .createBid(itemId, { value: ethers.utils.parseUnits(amount.toString(), 'ether') });
		await tx.wait();

    return true;
	}

  async endAuction(itemId: number): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
      .endAuction(itemId);
		await tx.wait();

    return true;
	}

  private async mapAuctions(items: any): Promise<NftAuction[]> {
    const auctions: NftAuction[] = await Promise.all(items.map(async (item: any) => {
      return this.mapAuction(item, false);
    }));
    
    return auctions;
  }

  async mapAuction(item: any, withDetails: boolean): Promise<NftAuction> {
    const nftContractWithProvider = this.reefService.nftContract.connect(this.reefService.evmProvider);

    const auctionData = await this.reefService.marketContract.connect(this.reefService.evmProvider).fetchAuctionData(Number(item.itemId));

    let metadata: Metadata;
    let metadataUri = '';
    try {
      metadataUri = await nftContractWithProvider.tokenURI(item.tokenId);
      metadata = await this.httpClient.get<Metadata>(metadataUri).toPromise();
    } catch (error: any) {
      console.log(error);
      metadata = { name: '', description: '', imageURI: '', properties: []};
    }

    const auction = new NftAuction();
    auction.deadline = new Date(Number(auctionData.deadline) * 1000);
    auction.deadlineReached = auction.deadline <= new Date();
    auction.minBid = auctionData.minBid;
    auction.minBidFormatted = bigNumberToNumber(auctionData.minBid);
    auction.highestBidder = auctionData.highestBidder;
    auction.highestBid = auctionData.highestBid;
    auction.highestBidFormatted = bigNumberToNumber(auctionData.highestBid);
    auction.itemId = item.itemId;
    auction.imageURI = metadata.imageURI;
    auction.name = metadata.name;
  
    if (withDetails) {
      const itemSales = item.sales.map((sale: any) => {
        return { 
          seller: sale.seller, 
          buyer: sale.buyer,
          price: bigNumberToNumber(sale.price)
        };
      });

      auction.seller = item.seller;
      auction.owner = item.owner;
      auction.creator = item.creator;
      auction.onSale = item.onSale;
      auction.description = metadata.description;
      auction.properties = metadata.properties;
      auction.typeItem = TypeItem.AUCTION;
      auction.sales = itemSales;

      const value = ethers.utils.parseUnits('100', 'ether');
      try {
        const royalties = await nftContractWithProvider.royaltyInfo(item.tokenId, value);
        auction.royaltiesRecipient = royalties.receiver;
        auction.royaltiesAmount = bigNumberToNumber(royalties.royaltyAmount);
      } catch (error) {
        console.log(error);
      }
      
      try {
        auction.mutable = await nftContractWithProvider.hasMutableURI(item.tokenId);
      } catch(error) {
        console.log(error);
      }
    }

    try {
      const item = await this.marketItemService.getMarketItem(auction.itemId).toPromise();
      auction.collection = item.collection;
    } catch(error) { }

    return auction;
  }

}

