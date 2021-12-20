import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { NFT, TypeItem } from '../_model/nft';
import { HttpClient } from '@angular/common/http';
import { Metadata } from '../_model/matadata';
import { ReefService } from './reef.service';
import { bigNumberToNumber, checkAccountAndClaim } from '../_utils/utils';
import { NftService } from './nft.service';
import { MarketItemService } from './market-item.service';
import { AuctionService } from './auction.service';
import { RaffleService } from './raffle.service';

@Injectable({
  providedIn: 'root'
})
export class MarketService {

constructor(private reefService: ReefService,
            private nftService: NftService,
            private auctionService: AuctionService,
            private raffleService: RaffleService,
            private marketItemService: MarketItemService,
            private httpClient: HttpClient) { }

  async getItemsOnSale(): Promise<NFT[]> {
		const allNFTs = await this.reefService.marketContract.connect(this.reefService.evmProvider).fetchItemsOnSale();
    const availableNFTs = allNFTs.filter((nft: any) => nft.onSale);

    return this.mapNfts(availableNFTs);
  }

  async getAddressOwnedNfts(address: string): Promise<NFT[]> {
		const addressOwnedNFTs = await this.reefService.marketContract.connect(this.reefService.evmProvider)
      .fetchAddressItemsOwned(address);

    return this.mapNfts(addressOwnedNFTs);
	}

  async getAddressCreatedNfts(address: string): Promise<NFT[]> {
		const addressCreatedNFTs = await this.reefService.marketContract.connect(this.reefService.evmProvider)
      .fetchAddressItemsCreated(address);
    
    return this.mapNfts(addressCreatedNFTs);
	}

  async getAddressItemsOnSale(address: string): Promise<NFT[]> {
		const addressOnSaleNFTs = await this.reefService.marketContract.connect(this.reefService.evmProvider)
      .fetchAddressItemsOnSale(address);
    
    return this.mapNfts(addressOnSaleNFTs);
	}

  async getNft(itemId: number): Promise<NFT> {
		const nft = await this.reefService.marketContract.connect(this.reefService.evmProvider).fetchItem(itemId);

    return this.mapNft(nft, true);
	}

  async createMarketItem(ipfsMetadataUrl: string, royaltiesAmount: number,  mutable: boolean, salePrice: number): Promise<number> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tokenId = await this.nftService.createNft(ipfsMetadataUrl, royaltiesAmount, mutable);

    if (salePrice) {
      return this.putNewNftOnSale(tokenId, salePrice);
    } else {
      const tx2 = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
        .createMarketItem(this.reefService.nftContract.address, tokenId);
      const receipt2 = await tx2.wait();
      const itemId = receipt2.events[0].args[0].toNumber();
      return itemId;
    }
	}

  async putNftOnSale(itemId: number, price: number): Promise<boolean> {
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
      .putMarketItemOnSale(itemId, ethers.utils.parseUnits(price.toString(), 'ether'));
    await tx.wait();

    return true;
  }

  async unlistNftOnSale(itemId: number): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
      .unlistMarketItem(itemId);
		await tx.wait();

    return true;
	}

  async buyNFT(nft: NFT): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
      .createMarketSale(nft.itemId, { value: nft.price });
		await tx.wait();

    return true;
	}

  private async putNewNftOnSale(tokenId: number, price: number): Promise<number> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

		const tx = await this.reefService.marketContract.connect(this.reefService.selectedSigner.signer)
      .putNewNftOnSale(this.reefService.nftContract.address, tokenId, ethers.utils.parseUnits(price.toString(), 'ether'));
		const receipt = await tx.wait();
    const itemId = receipt.events[2].args[0].toNumber();
    return itemId;
  }

  private async mapNfts(items: any): Promise<NFT[]> {
    const nfts: NFT[] = await Promise.all(items.map(async (item: any) => {
      return this.mapNft(item, false);
    }));
    
    return nfts;
  }

  private async mapNft(item: any, withDetails: boolean) {
    if (item.typeItem == TypeItem.AUCTION && item.onSale) {
      return this.auctionService.mapAuction(item, withDetails);
    } else if (item.typeItem == TypeItem.RAFFLE && item.onSale) {
      return this.raffleService.mapRaffle(item, withDetails);
    } else {
      return this.mapRegularNft(item, withDetails)
    }
  }

  private async mapRegularNft(item: any, withDetails: boolean): Promise<NFT> {
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

    const itemSales = item.sales.map((sale: any) => {
      return { 
        seller: sale.seller, 
        buyer: sale.buyer,
        price: bigNumberToNumber(sale.price)
      };
    });

    const nft: NFT = {
      itemId: Number(item.itemId),
      tokenId: Number(item.tokenId),
      price: item.price,
      priceFormatted: bigNumberToNumber(item.price),
      seller: item.seller,
      owner: item.owner,
      creator: item.creator,
      onSale: item.onSale,
      marketFee: Number(item.marketFee)/100,
      metadataURI: metadataUri,
      imageURI: metadata.imageURI,
      name: metadata.name,
      description: metadata.description,
      properties: metadata.properties,
      sales: itemSales,
      typeItem: item.typeItem      
    };

    if (withDetails) {
      const value = ethers.utils.parseUnits('100', 'ether');

      try {
        const royalties = await nftContractWithProvider.royaltyInfo(item.tokenId, value);
        nft.royaltiesRecipient = royalties.receiver;
        nft.royaltiesAmount = bigNumberToNumber(royalties.royaltyAmount);
      } catch (error) {
        console.log(error);
      }
      
      try {
        nft.mutable = await nftContractWithProvider.hasMutableURI(item.tokenId);
      } catch(error) {
        console.log(error);
      }
    }

    try {
      const item = await this.marketItemService.getMarketItem(nft.itemId).toPromise();
      nft.collection = item.collection;
    } catch(error) { }

    return nft;
  }

}

