import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateFormComponent } from './create-form/create-form.component';
import { FourZeroFourComponent } from './four-zero-four/four-zero-four.component';
import { ExploreComponent } from './explore/explore.component';
import { ProfileComponent } from './profile/profile.component';
import { AssetDetailComponent } from './asset-detail/asset-detail.component';
import { LendingComponent } from './lending/lending.component';
import { RafflesComponent } from './raffles/raffles.component';
import { CollectionComponent } from './collection/collection.component';

const routes: Routes = [
  {
    path: '', redirectTo: 'explore', pathMatch: 'full'
  },
  {
    path: 'explore',
    component: ExploreComponent
  },
  {
    path: 'user/:address',
    component: ProfileComponent
  },
  {
    path: 'create',
    component: CreateFormComponent
  },
  {
    path: 'edit/:itemId',
    component: CreateFormComponent
  },
  {
    path: 'asset/:itemId',
    component: AssetDetailComponent
  },
  {
    path: 'collection/:collectionId',
    component: CollectionComponent
  },
  {
    path: 'lending',
    component: LendingComponent
  },
  {
    path: 'raffles',
    component: RafflesComponent
  },
  {
    path: '**',
    component: FourZeroFourComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
