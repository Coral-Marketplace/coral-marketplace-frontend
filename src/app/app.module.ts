import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { NgxFileDropModule } from 'ngx-file-drop';
import { NgChartsModule } from 'ng2-charts';
import { MatSliderModule } from '@angular/material/slider';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppRoutingModule } from './app-routing.module';
import { BasicAuthHtppInterceptorService } from './_interceptors/basic.auth.http.interceptor.service';

import { AppComponent } from './app.component';
import { HeaderComponent } from './_components/header/header.component';
import { FourZeroFourComponent } from './four-zero-four/four-zero-four.component';
import { CreateFormComponent } from './create-form/create-form.component';
import { ExploreComponent } from './explore/explore.component';
import { ProfileComponent } from './profile/profile.component';
import { AssetDetailComponent } from './asset-detail/asset-detail.component';
import { ChartComponent } from './_components/chart/chart.component';
import { BannerComponent } from './_components/banner/banner.component';
import { ToggleButtonComponent } from './_components/toggle-button/toggle-button.component';
import { RafflesComponent } from './raffles/raffles.component';
import { LendingComponent } from './lending/lending.component';
import { NftListComponent } from './_components/nft-list/nft-list.component';
import { CollectionComponent } from './collection/collection.component';
import { CollectionListComponent } from './_components/collection-list/collection-list.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FourZeroFourComponent,
    CreateFormComponent,
    ExploreComponent,
    ProfileComponent,
    AssetDetailComponent,
    ChartComponent,
    BannerComponent,
    ToggleButtonComponent,
    RafflesComponent,
    LendingComponent,
    NftListComponent,
    CollectionComponent,
    CollectionListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgxFileDropModule,
    MatSliderModule,
    NgxSpinnerModule,
    MatTabsModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    NgChartsModule.forRoot({
      defaults: {},
      plugins: [ ]
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    ToastrModule.forRoot({
      timeOut: 5000,
      preventDuplicates: true,
      positionClass: 'toast-bottom-left'
    })
  ],
  providers: [{ 
    provide: HTTP_INTERCEPTORS, 
    useClass: BasicAuthHtppInterceptorService, 
    multi: true 
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function createTranslateLoader(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}
