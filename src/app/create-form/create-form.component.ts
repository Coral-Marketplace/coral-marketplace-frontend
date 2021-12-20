import { Component, OnInit } from '@angular/core';
import { NFT, NftProperty } from '../_model/nft';
import { IpfsService } from '../_service/ipfs.service';
import { Metadata } from '../_model/matadata';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { fromPromise } from 'rxjs/internal-compatibility';
import { NgxSpinnerService } from 'ngx-spinner';
import { MarketService } from '../_service/market.service';
import { ReefService } from '../_service/reef.service';
import { NftService } from '../_service/nft.service';
import { CollectionService } from '../_service/collection.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Collection } from '../_model/collection';
import { MarketItemService } from '../_service/market-item.service';
import { UserService } from '../_service/user.service';

@Component({
	selector: 'app-create',
	templateUrl: './create-form.component.html',
	styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent implements OnInit {
	edition: boolean;
	nft: NFT = new NFT();
	newImage: File;
	collections: Collection[] = [];
	newCollection: Collection;
	originalNft: NFT;
	isCreator: boolean;

	constructor(private marketService: MarketService,
				private reefService: ReefService,
				private nftService: NftService,
				private marketItemService: MarketItemService,
				private userService: UserService,
				private ipfsService: IpfsService,
				private translate: TranslateService,
				private toastr: ToastrService,
				private route: ActivatedRoute,
				private spinner: NgxSpinnerService,
				private router: Router,
				private modalService: NgbModal,
				private collectionService: CollectionService) { }

	ngOnInit(): void {
		const itemId = +this.route.snapshot.params['itemId'];
		if (itemId) {
			this.reefService.existsProviderSubject.subscribe((exists: boolean) => { 
				if (!exists) { return }
				this.loadNft(itemId);
			});
		}

		if (this.reefService.selectedSigner) {
			this.collectionService.getUserCollections(this.reefService.selectedSigner?.address)
				.subscribe((collections: Collection[]) => this.collections = collections);
		}

		this.userService.checkAuthToken().subscribe();
	}

	loadNft(itemId: number) {
		fromPromise(this.marketService.getNft(itemId)).subscribe(
			(nft: NFT) => {
				if (nft.owner != this.reefService.selectedSigner?.evmAddress) {
					this.router.navigate(['/explore']);
				}
				if (nft.creator == this.reefService.selectedSigner?.evmAddress) {
					this.isCreator = true;
				}
				this.edition = true;
				this.nft = nft;
				this.originalNft = JSON.parse(JSON.stringify(nft));
			},
			(error: any) => {
				console.log(error);
				this.toastr.error(
					this.translate.instant('toast.fetch-nft-error'),
					this.translate.instant('toast.error')
				);
			}
		);
	}

	dropped(files: NgxFileDropEntry[], target: string) {
		if (files[0].fileEntry.isFile) {
			const fileEntry = files[0].fileEntry as FileSystemFileEntry;
			fileEntry.file((file: File) => {
				const mimeType = file.type;

				if (mimeType.match(/image\/*/) == null) {
					this.toastr.error(
						this.translate.instant('toast.file-format-error'),
						this.translate.instant('toast.error')
					);
					return;
				}
		
				const maxFileSize = target == 'nft' ? 10485760 : 1048576;
				if (file.size > maxFileSize) {
					this.toastr.error(
						this.translate.instant('toast.file-too-large-error'),
						this.translate.instant('toast.error')
					);
					return;
				} 

				const reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = () => {
					switch(target) {
						case 'nft': this.nft.imageURI = reader.result as string;
						break;
						case 'colLogo': this.newCollection.logo = reader.result as string;
						break;
						case 'colBanner': this.newCollection.coverImage = reader.result as string;
						break;
					}
				};

				switch(target) {
					case 'nft': this.newImage = file;
					break;
					case 'colLogo': this.newCollection.logoFile = file;
					break;
					case 'colBanner': this.newCollection.bannerFile = file;
					break;
				}
			});
		} else {
			this.toastr.error(
				this.translate.instant('toast.file-upload-error'),
				this.translate.instant('toast.error')
			);
		}
	}

	addProperty(index: number) {
		this.nft.properties.splice(index + 1, 0, new NftProperty());
	}

	removeProperty(index: number) {
		this.nft.properties.splice(index, 1);
	}

	selectCollection(collection: Collection, modal: any) {
		this.nft.collection = collection;
		modal.close();
	}

	createCollection(modal: any) {
		this.spinner.show();

		this.collectionService.createCollection(this.newCollection).subscribe(
			(collection: Collection) => {
				this.spinner.hide();
				this.collections.push(collection);
				this.nft.collection = collection;
				modal.close();
			}, (error: any) => {
				this.spinner.hide();
				this.toastr.error(
					this.translate.instant('toast.create-collection-error'),
					this.translate.instant('toast.error'),
				);
			});
	}

	async submit() {
		if (this.edition) {
			const metadataChanged = this.metadataChanged();
			if (metadataChanged) {
				this.updateNftMetadata();
			}
			if (this.nft.collection?.id != this.originalNft.collection?.id) {
				this.updateNftCollection(metadataChanged);
			}
		} else {
			this.createNft();
		}
	}

	private async createNft() {
		this.spinner.show();

		const ipfsImageUrl = await this.ipfsService.uploadToIPFS(this.newImage);
		const metadata: Metadata = {
			name: this.nft.name, 
			description: this.nft.description, 
			imageURI: ipfsImageUrl,
			properties: this.nft.properties
		};
		const ipfsMetadataUrl: string = await this.ipfsService.uploadToIPFS(JSON.stringify(metadata));
		if (ipfsMetadataUrl == '') {
			this.spinner.hide();
			this.toastr.error(
				this.translate.instant('toast.upload-ipfs-error'),
				this.translate.instant('toast.error'),
			);
		}

		fromPromise(this.marketService.createMarketItem(ipfsMetadataUrl, this.nft.royaltiesAmount ? this.nft.royaltiesAmount : 0,
			this.nft.mutable ? this.nft.mutable : false, 0)).subscribe(
			(itemId: number) => {
				this.marketItemService.createMarketItem({id: itemId, collection: this.nft.collection}).subscribe(
					() => {},
					(error: any) => { console.log(error); }
				);
				this.spinner.hide();
				this.toastr.success(
					this.translate.instant('toast.nft-created'),
					this.translate.instant('toast.success')
				);

				this.router.navigate([`/asset/${itemId}`]);
			},
			(error: any) => {
				this.spinner.hide();
				if (error.toString().includes('Cancelled')) {
					this.toastr.info(
						this.translate.instant('toast.cacelled-by-user')
					);
				} else if (error.toString().includes('InsufficientBalance') || error.toString().includes('Inability to pay some fees')) {
					this.toastr.error(
						this.translate.instant('toast.insufficient-balance-error'),
						this.translate.instant('toast.error'),
					);
				} else {
					this.toastr.error(
						this.translate.instant('toast.create-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	async updateNftMetadata() {
		this.spinner.show();

		let ipfsImageUrl = this.nft.imageURI;
		if (this.newImage) {
			ipfsImageUrl = await this.ipfsService.uploadToIPFS(this.newImage);
		}

		const metadata: Metadata = {
			name: this.nft.name, 
			description: this.nft.description, 
			imageURI: ipfsImageUrl,
			properties: this.nft.properties
		};
		const ipfsMetadataUrl: string = await this.ipfsService.uploadToIPFS(JSON.stringify(metadata));
		if (ipfsMetadataUrl == '') {
			this.spinner.hide();
			this.toastr.error(
				this.translate.instant('toast.upload-ipfs-error'),
				this.translate.instant('toast.error'),
			);
		}

		fromPromise(this.nftService.updateNft(this.nft.tokenId, ipfsMetadataUrl)).subscribe(
			(success: boolean) => {
				this.spinner.hide();
				this.toastr.success(
					this.translate.instant('toast.nft-updated'),
					this.translate.instant('toast.success')
				);

				this.router.navigate([`/asset/${this.nft.itemId}`]);
			},
			(error: any) => {
				this.spinner.hide();
				if (error.toString().includes('Cancelled')) {
					this.toastr.info(
						this.translate.instant('toast.cacelled-by-user')
					);
				} else if (error.toString().includes('InsufficientBalance') || error.toString().includes('Inability to pay some fees')) {
					this.toastr.error(
						this.translate.instant('toast.insufficient-balance-error'),
						this.translate.instant('toast.error'),
					);
				} else {
					console.log(error);
					this.toastr.error(
						this.translate.instant('toast.update-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	updateNftCollection(metadataChanged: boolean) {
		if (!metadataChanged) {
			this.spinner.show();
		}
		this.marketItemService.updateMarketItem({id: this.nft.itemId, collection: this.nft.collection}).subscribe(
			(success: boolean) => {
				if (metadataChanged) { return }

				this.spinner.hide();
				this.toastr.success(
					this.translate.instant('toast.nft-collection-updated'),
					this.translate.instant('toast.success')
				);
				this.router.navigate([`/asset/${this.nft.itemId}`]);
			},
			(error: any) => { 
				console.log(error);
				if (!metadataChanged) { this.spinner.hide(); }
				this.toastr.error(
					this.translate.instant('toast.update-collection-error'),
					this.translate.instant('toast.error'),
				);
			}
		);
	}

	cancelCreation() {
		if (this.edition) {
			this.router.navigate([`/asset/${this.nft.itemId}`]);
		} else {
			this.nft = new NFT();
		}
	}


	// *************** Open modals*********************
	openSelectModal(modal: any) {
		this.modalService.open(modal);
	}

	openCreateModal(modal: any) {
		this.newCollection = new Collection();
		this.modalService.open(modal);
	}
	// *************************************************


	// ****************** Helpers **********************
	trackByIndex(index: number, item: any) {
        return index;
    }

	formatLabel(value: number) {
		return value / 100;
	}

	metadataChanged() {
		if (this.newImage || this.nft.name != this.originalNft.name || this.nft.description != this.originalNft.description || 
			this.nft.properties.length != this.originalNft.properties.length) {
			return true;
		}

		let metadataChanged = false;
		this.nft.properties.forEach((prop: NftProperty, index: number) => {
			if (prop.name != this.originalNft.properties[index].name || prop.value != this.originalNft.properties[index].value) {
				metadataChanged = true;
			}
		});

		return metadataChanged;
	}
	// *************************************************

}
