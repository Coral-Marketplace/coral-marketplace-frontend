import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BACKEND_URL } from '../_config/config';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { User } from '../_model/user';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ReefService } from './reef.service';
import { fromPromise } from 'rxjs/internal-compatibility';

@Injectable({
	providedIn: 'root'
})
export class UserService {

	USER_URL = 'user';

	userLoggedIn = new BehaviorSubject<boolean>(false);

	constructor(private httpClient: HttpClient,
				private toastr: ToastrService,
				private translate: TranslateService,
				private reefService: ReefService) { }

	logIn(): Observable<any> {
		if (!this.reefService.selectedSigner) {
			this.toastr.error(
				this.translate.instant('toast.no-signer-selected'),
				this.translate.instant('toast.error'),
			);

			return EMPTY;
		}

		return this.getNonce(this.reefService.selectedSigner.address)
			.pipe(switchMap(
				(nonce: number) => {
					return fromPromise(this.reefService.signMessage(nonce.toString()));
				}
			))
			.pipe(switchMap(
				(signature: string) => {
					const address = this.reefService.selectedSigner ? this.reefService.selectedSigner.address : '';
					const evmAddress = this.reefService.selectedSigner ? this.reefService.selectedSigner.evmAddress : '';
					return this.confirmSignature(address, signature, evmAddress);
				}
			));
	}

	updateUser(user: User, avatar: File, coverImage: File): Observable<User> {
		const formData: FormData = new FormData();
		formData.append('name', user.name);
        formData.append('avatar', avatar);
		formData.append('coverImage', coverImage);
		return this.httpClient.post<User>(`${BACKEND_URL}/${this.USER_URL}/${user.publicAddress}`, formData);
	}

	checkAuthToken() {
		return this.httpClient.post<any>(`${BACKEND_URL}/check-auth-token`, {});
	}
	
	logOut(): void {
		sessionStorage.removeItem('address');
		this.userLoggedIn.next(false);
	}

	getUser(publicAddress: string): Observable<User> {
        return this.httpClient.get<User>(`${BACKEND_URL}/${this.USER_URL}/${publicAddress}`);
    }

	deleteUser(publicAddress: string): Observable<any> {
        return this.httpClient.delete<any>(`${BACKEND_URL}/${this.USER_URL}/${publicAddress}`);
    }

	loggedAddress(): string {
		const loggedAddress = sessionStorage.getItem('address');
		return loggedAddress ? loggedAddress : '';
	}

	checkLoggedUser(): void {
		const loggedAddress = sessionStorage.getItem('address');
		if (loggedAddress) {
			this.userLoggedIn.next(true);
		}
	}

	private getNonce(publicAddress: string): Observable<number> {
        return this.httpClient.get<number>(`${BACKEND_URL}/${this.USER_URL}/nonce/${publicAddress}`);
    }

	private confirmSignature(publicAddress: string, signature: string, evmAddress: string): Observable<any> {
        return this.httpClient.post(`${BACKEND_URL}/authenticate`, 
			{ publicAddress, signature, evmAddress })
			.pipe(map((userData: any) => {
				sessionStorage.setItem('address', publicAddress);
				const tokenStr = 'Bearer ' + userData.token;
				sessionStorage.setItem('token', tokenStr);
				this.userLoggedIn.next(true);
				return userData;
			})
		);
    }
}