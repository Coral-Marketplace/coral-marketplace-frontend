import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { fromPromise } from 'rxjs/internal-compatibility';
import { NFT, TypeItem } from '../_model/nft';
import { UserService } from '../_service/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute } from '@angular/router';
import { User } from '../_model/user';
import { MarketService } from '../_service/market.service';
import { NftLoan } from '../_model/loan';
import { LoanService } from '../_service/loan.service';
import { RaffleService } from '../_service/raffle.service';
import { NftRaffle } from '../_model/raffle';
import { CollectionService } from '../_service/collection.service';
import { Collection } from '../_model/collection';
import { AuctionService } from '../_service/auction.service';
import { NftAuction } from '../_model/auction';
import { ReefSigner } from '../_model/reefSigner';
import { ReefService } from '../_service/reef.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})

export class ProfileComponent implements OnInit {

  TypeItem = TypeItem;
  
  user: User;
  currentUser: boolean;
  originalName: string;
  editName: boolean;
  newCoverImage: File;
  newAvatar: File;
  unsavedChanges: boolean;

  ownedNFTs: NFT[];
  onSaleNFTs: NFT[];
  createdNFTs: NFT[];
  openRaffles: NftRaffle[];
  openLoans: NftLoan[];
  activeLoans: NftLoan[];
  auctionBids: NftAuction[];
  collections: Collection[];

  constructor(private marketService: MarketService,
              private userService: UserService,
              private loanService: LoanService,
              private raffleService: RaffleService,
              private auctionService: AuctionService,
              private reefService: ReefService,
              private toastr: ToastrService,
              private translate: TranslateService,
              private route: ActivatedRoute,
              private spinner: NgxSpinnerService,
              private collectionService: CollectionService) { }

  ngOnInit(): void {
    const address = this.route.snapshot.params['address'];
    
    this.userService.getUser(address).subscribe((user: User) => {
      this.user = user;
      if (!this.user.avatar) {
        this.user.avatar = './../../../assets/img/empty-avatar.png';
      }

      this.getOwnedNfts(this.user.evmAddress);
      this.getNftsOnSale(this.user.evmAddress);
      this.getCreatedNfts(this.user.evmAddress);
      this.getOpenRaffles(this.user.evmAddress);
      this.getCollections(address);
      this.getLoanProposals(address);

      this.reefService.selectedSignerSubject.subscribe((signer: ReefSigner|null) => { 
        if (signer) { 
          this.currentUser = address == signer.address;
          if (this.currentUser) {
            this.originalName = this.user.name;
            if (!this.originalName) {
              this.editName = true;
            }
            this.getActiveLoans(this.user.evmAddress);
            this.getBids(this.user.evmAddress);
          }
        }
      });
    });
  }

  getOwnedNfts(evmAddress: string) {
    fromPromise(this.marketService.getAddressOwnedNfts(evmAddress)).subscribe(
      (nfts: NFT[]) => this.ownedNFTs = nfts,
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-nfts-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getNftsOnSale(evmAddress: string) {
    fromPromise(this.marketService.getAddressItemsOnSale(evmAddress)).subscribe(
      (nfts: NFT[]) => this.onSaleNFTs = nfts,
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-nfts-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getCreatedNfts(evmAddress: string) {
    fromPromise(this.marketService.getAddressCreatedNfts(evmAddress)).subscribe(
      (nfts: NFT[]) => this.createdNFTs = nfts,
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-nfts-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getOpenRaffles(address: string) {
    fromPromise(this.raffleService.getAddressOpenRaffles(address)).subscribe(
      (raffles: NftRaffle[]) => { this.openRaffles = raffles },
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-raffles-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getLoanProposals(address: string) {
    fromPromise(this.loanService.getAddressOpenLoans(address)).subscribe(
      (loans: NftLoan[]) => { this.openLoans = loans },
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-loans-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getCollections(address: string) {
    this.collectionService.getUserCollections(address).subscribe(
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

  getActiveLoans(address: string) {
    fromPromise(this.loanService.getAddressActiveLoans(address)).subscribe(
      (loans: NftLoan[]) => { this.activeLoans = loans },
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-loans-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  getBids(address: string) {
    fromPromise(this.auctionService.getAddressBids(address)).subscribe(
      (auctions: NftAuction[]) => { this.auctionBids = auctions },
      (error: any) => {
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.fetch-bids-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  onFileUpload(event: any, input: string) {
    if (event.target.files.length === 0) { return; }

    const file: File = event.target.files[0];

    const mimeType = file.type;
    if (mimeType.match(/image\/*/) == null) {
      this.toastr.error(
        this.translate.instant('toast.file-format-error'),
        this.translate.instant('toast.error')
      );
      return;
    }

    if (file.size > 1048576) {
      this.toastr.error(
        this.translate.instant('toast.file-too-large-error'),
        this.translate.instant('toast.error')
      );
      return;
    } 

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (input == 'cover') {
          this.user.coverImage = reader.result as string;
        } else {
          this.user.avatar = reader.result as string;
        }
    };

    if (input == 'cover') {
      this.newCoverImage = file;
    } else {
      this.newAvatar = file;
    }

    this.unsavedChanges = true;
  }

  /**
   * Resets the upload input value. Without it, if the user tries to upload the same file
   * again onChange event will not be triggered
   */
  onFileUploadClick(input: any) {
    input.value = null;
  }

  onKeydown(event: any) {
    if (!this.user.name) {
      return;
    }
    
    if (event.key === 'Enter') {
      this.editName = false;
    }

    if (this.user.name != this.originalName && !this.newAvatar && !this.newCoverImage) {
      this.unsavedChanges = true;
    } else {
      this.unsavedChanges = false;
    }
  }

  onBlur() {
    if (!this.user.name) {
      return;
    }

    this.editName = false;

    if (this.user.name != this.originalName && !this.newAvatar && !this.newCoverImage) {
      this.unsavedChanges = true;
    } else {
      this.unsavedChanges = false;
    }
  }

  saveChanges() {
    this.spinner.show();

    this.userService.updateUser(this.user, this.newAvatar, this.newCoverImage).subscribe(
      (user: User) => {
          this.spinner.hide();
          this.toastr.success(
            this.translate.instant('toast.changes-saved'),
            this.translate.instant('toast.success')
          );
        },
        (error: any) => {
          console.log(error);
          this.spinner.hide();
          this.toastr.error(
            this.translate.instant('toast.changes-not-saved'),
            this.translate.instant('toast.error'),
          );
        }
      );
  }

}
