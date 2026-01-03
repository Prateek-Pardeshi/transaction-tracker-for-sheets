import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/Dashboard/dashboard.component';
import { AddDataRecordsComponent } from '@components/Add-data-records/add-data-records.component';
import { AccessDeniedComponent } from './components/Access-denied/access-denied.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  // { path: 'auth/callback', component: AppComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'addRecord', component: AddDataRecordsComponent },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', component: AccessDeniedComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {}