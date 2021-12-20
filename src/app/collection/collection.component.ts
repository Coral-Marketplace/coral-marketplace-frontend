import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { fromPromise } from 'rxjs/internal-compatibility';
import { NFT, TypeItem } from '../_model/nft';
import { ReefService } from '../_service/reef.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { MarketService } from '../_service/market.service';
import { CollectionService } from '../_service/collection.service';
import { Collection } from '../_model/collection';
import { ReefSigner } from '../_model/reefSigner';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html'
})
export class CollectionComponent implements OnInit {

  collectionId: number;
  collection: Collection;
  nfts: NFT[];
  currentPublicAddress: string;
  isOwner: boolean;
  originalName: string;
  editName: boolean;
  originalDesc: string;
  editDesc: boolean;
  unsavedChanges: boolean;
  TypeItem = TypeItem;

  constructor(private reefService: ReefService,
              private collectionService: CollectionService,
              private marketService: MarketService,
              private route: ActivatedRoute,
              private toastr: ToastrService,
              private translate: TranslateService,
              private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.collectionId = this.route.snapshot.params['collectionId'];

    this.reefService.existsProviderSubject.subscribe((exists: boolean) => { 
      if (!exists) { return }
      this.loadCollection();
    });

    this.reefService.selectedSignerSubject.subscribe((signer: ReefSigner|null) => { 
			if (signer) { 
        this.currentPublicAddress = signer.address; 
        this.checkOwner();
      }
		});
  }

  loadCollection() {
    this.collectionService.getCollection(this.collectionId).subscribe(
      (collection: Collection) => { 
        this.collection = collection; 
        this.checkOwner();
        if (this.isOwner) {
          this.originalName = this.collection.name;
          this.originalDesc = this.collection.description;
          if (!this.originalDesc || this.originalDesc == '') {
            this.editDesc = true;
          }
        }
        this.getCollectionNfts();
      },
      (error: any) => {
        this.toastr.error(
          this.translate.instant('toast.fetch-collection-error'),
          this.translate.instant('toast.error')
        );
      }
    );
  }

  checkOwner() {
    this.isOwner = !!this.collection && !!this.currentPublicAddress &&
      this.collection.userPublicAddress == this.currentPublicAddress;
  }

  getCollectionNfts() {
    if (!this.collection.itemIds?.length) {
      this.nfts = [];
      return;
    }

    this.collection.itemIds.forEach((itemId: number) => {
      fromPromise(this.marketService.getNft(itemId)).subscribe(
        (nft: NFT) => {
          if (this.nfts) {
            this.nfts.push(nft);
          } else {
            this.nfts = [nft];
          }
        },
        (error: any) => {
          this.toastr.error(
            this.translate.instant('toast.fetch-nfts-error'),
            this.translate.instant('toast.error')
          );
        }
      );
    });
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
          this.collection.coverImage = reader.result as string;
        } else {
          this.collection.logo = reader.result as string;
        }
    };

    if (input == 'cover') {
      this.collection.bannerFile = file;
    } else {
      this.collection.logoFile = file;
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
      if (event.key === 'Enter') {
        this.editName = !this.collection.name || this.collection.name.trim() == '';
        this.editDesc = !this.collection.description || this.collection.description.trim() == '';
      }
  
      this.checkUnsavedChanges();
    }

    onBlur() {
      this.editName = !this.collection.name || this.collection.name.trim() == '';
      this.editDesc = !this.collection.description || this.collection.description.trim() == '';
      this.checkUnsavedChanges();
    }

    checkUnsavedChanges() {
      this.unsavedChanges = this.collection.name != this.originalName || this.collection.description != this.originalDesc 
        || !!this.collection.bannerFile || !!this.collection.logoFile;
    }

    saveChanges() {
      this.spinner.show();
  
      this.collectionService.updateCollection(this.collection).subscribe(
        (collection: Collection) => {
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
