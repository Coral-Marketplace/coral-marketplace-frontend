import { Component, OnInit } from '@angular/core';
import { LoanService } from '../_service/loan.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { fromPromise } from 'rxjs/internal-compatibility';
import { ReefService } from '../_service/reef.service';
import { LoanState, NftLoan } from '../_model/loan';
import { TypeItem } from '../_model/nft';

@Component({
  selector: 'app-lending',
  templateUrl: './lending.component.html'
})
export class LendingComponent implements OnInit {

  openLoans: NftLoan[];
  TypeItem = TypeItem;

  constructor(private loanService: LoanService,
              private reefService: ReefService,
              private toastr: ToastrService,
              private translate: TranslateService
              ) { }

  ngOnInit(): void {
    this.reefService.existsProviderSubject.subscribe((exists: boolean) => { 
      if (!exists) { return }
      fromPromise(this.loanService.getLoans(LoanState.OPEN)).subscribe(
        (loans: NftLoan[]) => { this.openLoans = loans },
        (error: any) => {
          console.log(error);
          this.toastr.error(
						this.translate.instant('toast.fetch-loans-error'),
						this.translate.instant('toast.error')
					);
        }
      );
    });
  }

}
