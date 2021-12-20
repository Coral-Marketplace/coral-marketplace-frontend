import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { fromPromise } from 'rxjs/internal-compatibility';
import { NFT, Sale, TypeItem } from '../_model/nft';
import { ReefService } from '../_service/reef.service';
import { PriceService } from '../_service/price.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { MarketService } from '../_service/market.service';
import { AuctionService } from '../_service/auction.service';
import { LoanService } from '../_service/loan.service';
import { RaffleService } from '../_service/raffle.service';
import { NftLoan } from '../_model/loan';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReefSigner } from '../_model/reefSigner';

@Component({
	selector: 'app-asset-detail',
	templateUrl: './asset-detail.component.html',
	styleUrls: ['./asset-detail.component.scss']
})
export class AssetDetailComponent implements OnInit {

	itemId: number;
	nft: NFT;
	nftPrice: number;
	currentAddress: string;
	marketFee: number;
	reefMarketPrice: number;
	TypeItem = TypeItem;

	// Creation data
	loanData: NftLoan;
	numDays : number;
	minBid: number;
	fixedPrice: boolean;

	// Interaction data
	raffleAmount: number;
	bidAmount: number;

	constructor(private reefService: ReefService,
				private marketService: MarketService,
				private auctionService: AuctionService,
				private loanService: LoanService,
				private raffleService: RaffleService,
				private modalService: NgbModal,
				private route: ActivatedRoute,
				private router: Router,
				private priceService: PriceService,
				private toastr: ToastrService,
				private translate: TranslateService,
				private spinner: NgxSpinnerService) { }

	ngOnInit(): void {
		this.itemId = this.route.snapshot.params['itemId'];

		this.reefService.existsProviderSubject.subscribe((exists: boolean) => { 
			if (!exists) { return }
			this.loadNft();
		});

		this.priceService.getReefMarketPrice().subscribe((marketPrice: number) => {
			this.reefMarketPrice = marketPrice;
			if (this.nft) { this.setDollarPrices(); }
		});

		this.reefService.selectedSignerSubject.subscribe((signer: ReefSigner|null) => { 
			if (signer) { this.currentAddress = signer.evmAddress; }
		});

		this.reefService.marketFeeSubject.subscribe((marketFee: number) => { 
			this.marketFee = marketFee;
		});
	}

	loadNft() {
		fromPromise(this.marketService.getNft(this.itemId)).subscribe(
			(nft: NFT) => { 
				this.nft = nft; 
				if (this.reefMarketPrice) { this.setDollarPrices(); }
			},
			(error: any) => {
				this.toastr.error(
					this.translate.instant('toast.fetch-nft-error'),
					this.translate.instant('toast.error')
				);
			}
		);
	}

	setDollarPrices() {
		this.nft.dollarPrice = this.nft.priceFormatted * this.reefMarketPrice;
		this.nft.sales.forEach((sale: Sale) => { 
			sale.dollarPrice = sale.price * this.reefMarketPrice;
		});
	}


	// ************** Creations *********************
	putOnSale(modal: any) {
		this.spinner.show();

		fromPromise(this.marketService.putNftOnSale(this.nft.itemId, this.nft.priceFormatted)).subscribe(
			(success: boolean) => {
				this.spinner.hide();
				this.toastr.success(
					this.translate.instant('toast.nft-on-sale'),
					this.translate.instant('toast.success')
				);
				modal.close();
				this.loadNft();
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
						this.translate.instant('toast.create-sale-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	putOnAuction(modal: any) {
		this.spinner.show();

		fromPromise(this.auctionService.createAuction(this.nft.itemId, this.numDays * 60  * 24, this.minBid)).subscribe(
			(success: boolean) => {
				this.spinner.hide();
				this.toastr.success(
					this.translate.instant('toast.nft-on-sale'),
					this.translate.instant('toast.success')
				);
				modal.close();
				this.loadNft();
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
						this.translate.instant('toast.create-sale-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	createRaffle(modal: any) {
		this.spinner.show();

		fromPromise(this.raffleService.createRaffle(this.nft.itemId, this.numDays * 60 * 24)).subscribe(
			(success: boolean) => {
				this.spinner.hide();
				this.toastr.success(
					this.translate.instant('toast.raffle-created'),
					this.translate.instant('toast.success')
				);
				modal.close();
				this.loadNft();
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
						this.translate.instant('toast.create-raffle-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	createLoan(modal: any) {
		this.spinner.show();

		fromPromise(this.loanService.createLoan(this.nft.itemId, this.loanData.loanAmountFormatted, 
			this.loanData.feeAmountFormatted, this.numDays * 60 * 24)).subscribe(
			(loanId: number) => {
				this.spinner.hide();
				this.toastr.success(
					this.translate.instant('toast.loan-created'),
					this.translate.instant('toast.success')
				);
				modal.close();
				this.router.navigate([`/lending`]);
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
						this.translate.instant('toast.create-loan-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}
	// *********************************************


	// *************** Interactions ****************
	buy() {
		this.spinner.show();

		fromPromise(this.marketService.buyNFT(this.nft)).subscribe(
			(success: boolean) => {
				this.spinner.hide();
				this.loadNft();
				this.toastr.success(
					this.translate.instant('toast.nft-bought'),
					this.translate.instant('toast.success')
				);
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
						this.translate.instant('toast.generic-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	unlist() {
		this.spinner.show();

		fromPromise(this.marketService.unlistNftOnSale(this.nft.itemId)).subscribe(
		(success: boolean) => {
			this.spinner.hide();
			this.loadNft();
				this.toastr.success(
					this.translate.instant('toast.item-unlisted'),
					this.translate.instant('toast.success')
				);
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
						this.translate.instant('toast.item-unlist-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	endRaffle() {
		this.spinner.show();

		fromPromise(this.raffleService.endRaffle(this.nft.itemId)).subscribe(
			(success: boolean) => {
				this.spinner.hide();
				this.loadNft();
				this.toastr.success(
					this.translate.instant('toast.raffle-ended'),
					this.translate.instant('toast.success')
				);
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
						this.translate.instant('toast.raffle-end-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	endAuction() {
		this.spinner.show();

		fromPromise(this.auctionService.endAuction(this.nft.itemId)).subscribe(
			(success: boolean) => {
				this.spinner.hide();
				this.loadNft();
				this.toastr.success(
					this.translate.instant('toast.auction-ended'),
					this.translate.instant('toast.success')
				);
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
						this.translate.instant('toast.auction-end-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	bid(modal: any) {
		this.spinner.show();

		fromPromise(this.auctionService.createBid(this.nft.itemId, this.bidAmount)).subscribe(
			(success: boolean) => {
				this.spinner.hide();
				modal.close();
				this.loadNft();
					this.toastr.success(
						this.translate.instant('toast.bidded'),
						this.translate.instant('toast.success')
					);
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
						this.translate.instant('toast.bid-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}

	enterRaffle(modal: any) {
		this.spinner.show();
		
		fromPromise(this.raffleService.enterRaffle(this.nft.itemId, this.raffleAmount)).subscribe(
			(success: boolean) => {
				modal.close();
				this.spinner.hide();
				this.loadNft();
				this.toastr.success(
					this.translate.instant('toast.raffle-entered'),
					this.translate.instant('toast.success')
				);
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
						this.translate.instant('toast.raffle-entry-error'),
						this.translate.instant('toast.error'),
					);
				}
			}
		);
	}
	// *********************************************


	// ************* Open modals *******************
	openSaleModal(modal: any) {
		this.fixedPrice = false;
		this.numDays = 0;
		this.minBid = 0;
		this.nft.priceFormatted = 0;
		this.modalService.open(modal);
	}

	openRaffleModal(modal: any) {
		this.numDays = 0;
		this.modalService.open(modal);
	}

	openLoanModal(modal: any) {
		this.numDays = 0;
		this.loanData = new NftLoan();
		this.modalService.open(modal);
	}
	
	openInteractionModal(modal: any) {
		this.bidAmount = 0;
		this.raffleAmount = 0;
		this.modalService.open(modal);
	}
	// *********************************************
	
}
