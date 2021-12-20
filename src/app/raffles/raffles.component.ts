import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { fromPromise } from 'rxjs/internal-compatibility';
import { ReefService } from '../_service/reef.service';
import { NftRaffle } from '../_model/raffle';
import { TypeItem } from '../_model/nft';
import { RaffleService } from '../_service/raffle.service';

@Component({
  selector: 'app-raffles',
  templateUrl: './raffles.component.html'
})
export class RafflesComponent implements OnInit {

  openRaffles: NftRaffle[];
  TypeItem = TypeItem;

  constructor(private raffleService: RaffleService,
              private reefService: ReefService,
              private toastr: ToastrService,
              private translate: TranslateService) { }

  ngOnInit(): void {
    this.reefService.existsProviderSubject.subscribe((exists: boolean) => { 
      if (!exists) { return }
      fromPromise(this.raffleService.getOpenRaffles()).subscribe(
        (raffles: NftRaffle[]) => { this.openRaffles = raffles },
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
