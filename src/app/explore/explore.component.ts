import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { fromPromise } from 'rxjs/internal-compatibility';
import { NFT, TypeItem } from '../_model/nft';
import { ReefService } from '../_service/reef.service';
import { MarketService } from '../_service/market.service';
import { Collection } from '../_model/collection';
import { CollectionService } from '../_service/collection.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html'
})
export class ExploreComponent implements OnInit {

  TypeItem = TypeItem;
  collections: Collection[];
  nftsOnSale: NFT[];
  bids: any[];
  
  constructor(private reefService: ReefService,
              private marketService: MarketService,
              private collectionService: CollectionService,
              private toastr: ToastrService,
              private translate: TranslateService) { }

  ngOnInit(): void {
    this.reefService.existsProviderSubject.subscribe((exists: boolean) => { 
      if (!exists) { return }
      this.getCollections();
      this.getNftsOnsale();
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
        this.bids = nfts.filter((nft: any) => {
          nft.typeItem == TypeItem.AUCTION && nft.highestBidder;
        });
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

  getLastBids() {

  }

}
