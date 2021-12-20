import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { fromPromise } from 'rxjs/internal-compatibility';
import { NftAuction } from 'src/app/_model/auction';
import { LoanState, NftLoan } from 'src/app/_model/loan';
import { NFT, TypeItem } from 'src/app/_model/nft';
import { NftRaffle } from 'src/app/_model/raffle';
import { ReefSigner } from 'src/app/_model/reefSigner';
import { LoanService } from 'src/app/_service/loan.service';
import { MarketService } from 'src/app/_service/market.service';
import { ReefService } from 'src/app/_service/reef.service';

@Component({
  selector: 'app-nft-list',
  templateUrl: './nft-list.component.html'
})
export class NftListComponent implements OnInit {

  @Input() nfts: (NFT | NftRaffle | NftLoan | NftAuction)[];
  @Input() typeItem: TypeItem;
  @Input() emptyMessageKey: string;

  currentAddress: string;
  currentPublicAddress: string;
  TypeItem = TypeItem;
  LoanState = LoanState;

  constructor(private translate: TranslateService,
              private spinner: NgxSpinnerService,
              private reefService: ReefService,
              private marketService: MarketService,
              private loanService: LoanService,
              private router: Router,
              private toastr: ToastrService
              ) { }

  ngOnInit(): void {
    this.reefService.selectedSignerSubject.subscribe((signer: ReefSigner|null) => { 
      if (signer) { 
        this.currentAddress = signer.evmAddress;
        this.currentPublicAddress = signer.address;
      }
    });
  }

  async buyNFT(nft: NFT) {
    this.spinner.show();

		fromPromise(this.marketService.buyNFT(nft)).subscribe(
      (success: boolean) => {
        this.spinner.hide();

        this.toastr.success(
          this.translate.instant('toast.nft-bought'),
          this.translate.instant('toast.success')
        );
        this.router.navigate([`/asset/${nft.itemId}`]);
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
						this.translate.instant('toast.generic-error'),
						this.translate.instant('toast.error'),
					);
				}
      }
    );
	}

  fundLoan(loan: NftLoan) {
    this.spinner.show();

    fromPromise(this.loanService.fundLoan(loan)).subscribe(
      (success: boolean) => {
        this.spinner.hide();

        this.toastr.success(
          this.translate.instant('toast.loan-funded'),
          this.translate.instant('toast.success')
        );
        this.router.navigate([`/user/${this.currentPublicAddress}`]);
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
						this.translate.instant('toast.fund-loan-error'),
						this.translate.instant('toast.error'),
					);
				}
      }
    );
  }

  unlistLoan(loan: NftLoan) {
    this.spinner.show();

    fromPromise(this.loanService.unlistLoan(loan.loanId)).subscribe(
      (success: boolean) => {
        this.spinner.hide();

        this.toastr.success(
          this.translate.instant('toast.unlist-loan'),
          this.translate.instant('toast.success')
        );
        this.router.navigate([`/asset/${loan.itemId}`]);
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
						this.translate.instant('toast.unlist-loan-error'),
						this.translate.instant('toast.error'),
					);
				}
      }
    );
  }

  repayLoan(loan: NftLoan) {
    this.spinner.show();

    fromPromise(this.loanService.repayLoan(loan)).subscribe(
      (success: boolean) => {
        this.spinner.hide();

        this.toastr.success(
          this.translate.instant('toast.repay-loan'),
          this.translate.instant('toast.success')
        );
        this.router.navigate([`/asset/${loan.itemId}`]);
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
						this.translate.instant('toast.repay-loan-error'),
						this.translate.instant('toast.error'),
					);
				}
      }
    );
  }

  liquidateLoan(loan: NftLoan) {
    this.spinner.show();

    fromPromise(this.loanService.liquidateLoan(loan.loanId)).subscribe(
      (success: boolean) => {
        this.spinner.hide();

        this.toastr.success(
          this.translate.instant('toast.liquidate-loan'),
          this.translate.instant('toast.success')
        );
        this.router.navigate([`/asset/${loan.itemId}`]);
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
						this.translate.instant('toast.liquidate-loan-error'),
						this.translate.instant('toast.error'),
					);
				}
      }
    );
  }

}
