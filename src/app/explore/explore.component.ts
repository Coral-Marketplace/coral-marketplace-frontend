import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { fromPromise } from 'rxjs/internal-compatibility';
import { NFT, TypeItem } from '../_model/nft';
import { ReefService } from '../_service/reef.service';
import { MarketService } from '../_service/market.service';
import { Collection } from '../_model/collection';
import { CollectionService } from '../_service/collection.service';
import { AuctionService } from '../_service/auction.service';
import { NftAuction } from '../_model/auction';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html'
})
export class ExploreComponent implements OnInit {

  TypeItem = TypeItem;
  collections: Collection[];
  nftsOnSale: NFT[];
  openAuctions: NftAuction[];
  
  constructor(private reefService: ReefService,
              private marketService: MarketService,
              private auctionService: AuctionService,
              private collectionService: CollectionService,
              private toastr: ToastrService,
              private translate: TranslateService) { }

  ngOnInit(): void {
    this.reefService.existsProviderSubject.subscribe((exists: boolean) => { 
      if (!exists) { return }
      this.getCollections();
      this.getNftsOnsale();
      this.getOpenAuctions();
    });
  }

  getCollections() {
    this.collectionService.getAllCollections().subscribe(
      (collections: Collection[]) => { this.collections = collections },
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-collections-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getNftsOnsale() {
    fromPromise(this.marketService.getItemsOnSale()).subscribe(
      (nfts: NFT[]) => {
        this.nftsOnSale = nfts;
      },
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-nfts-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getOpenAuctions() {
    fromPromise(this.auctionService.fetchOpenAuctions()).subscribe(
      (auctions: NftAuction[]) => {
        this.openAuctions = auctions;
      },
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-auctions-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getLastBids() {

  }

}
