import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { EMPTY, throwError } from 'rxjs';
import { UserService } from '../_service/user.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class BasicAuthHtppInterceptorService implements HttpInterceptor {

  constructor(private userService: UserService,
              private translate: TranslateService,
              private toastr: ToastrService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    if (sessionStorage.getItem('address') && sessionStorage.getItem('token')) {
      request = request.clone({
        setHeaders: { Authorization: sessionStorage.getItem('token') as string }
      });
    }

    return next.handle(request).pipe(
      catchError((error: any) => {
        if (!(error instanceof ErrorEvent) && error.status == 401) {
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
                this.translate.instant('toast.error')
              );
            }
          );

          return EMPTY;
        }
        return throwError(error);
      })
    );
  }
}
