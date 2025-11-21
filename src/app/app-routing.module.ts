import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/Dashboard/dashboard.component';
import { AccessDeniedComponent } from './components/Access-denied/access-denied.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  { path: 'auth/callback', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', redirectTo: 'access-denied', pathMatch: 'full' },
  { path: '**', component: AccessDeniedComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {}