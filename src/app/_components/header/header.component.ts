import { Component, OnInit, Renderer2 } from '@angular/core';
import { ReefSigner } from '../../_model/reefSigner';
import { getTheme, saveTheme } from '../../_service/localStore';
import { ReefService } from '../../_service/reef.service';
import { UserService } from '../../_service/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { switchMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  signers: ReefSigner[];
  selectedSigner: ReefSigner | null;
  selectedSignerTemp: ReefSigner; // Signer selected in form
  darkMode: boolean;
  isNavbarCollapsed = true;

  constructor(private reefService: ReefService,
              private modalService: NgbModal,
              private toastr: ToastrService,
              private translate: TranslateService,
              private renderer: Renderer2,
              public userService: UserService) { }

  ngOnInit(): void {
    this.userService.checkLoggedUser();
    
    this.darkMode = getTheme();
    if (this.darkMode) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }

    this.reefService.signersSubject.subscribe((signers: ReefSigner[]|null) => {
      if (!signers) { return }
      this.signers = signers;
      const selection = signers.find(signer => signer.selected);
      this.selectedSigner = selection ? selection : null;
    });
  }

  openModal(modal: any) {
    this.selectedSignerTemp = this.selectedSigner ? this.selectedSigner : new ReefSigner();
    this.modalService.open(modal);
  }

  confirmSelection(modal: any) {
    this.reefService.updateSelectedSigner(this.selectedSignerTemp);
    this.selectedSigner = this.selectedSignerTemp;
    this.login();
    modal.close();
  }

  toggleDarkMode(e: any) {
    if (this.darkMode) {
      this.darkMode = false;
      this.renderer.removeClass(document.body, 'dark-theme');
    } else {
      this.darkMode = true;
      this.renderer.addClass(document.body, 'dark-theme');
    }
    saveTheme(this.darkMode);
  }

  login() {
    this.userService.logIn().subscribe(
      (userData: any) => {
        this.toastr.success(
          this.translate.instant('toast.login-success'),
          this.translate.instant('toast.success')
        );
      },
      (error: any) => { 
        console.log(error);
        this.toastr.error(
          this.translate.instant('toast.login-error'),
          this.translate.instant('toast.error'),
        );
      }
    );
  }

  getAddress() {
    sessionStorage.getItem('address');
  }

}
