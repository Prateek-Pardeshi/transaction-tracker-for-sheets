import { NgModule } from '@angular/core';
import { CommonModule, NgFor, NgIf, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SheetConnectorComponent } from './SheetConnector/sheetConnector.component';
import { SummaryComponent } from './Summary/summary.comopnent';
import { TransactionFormComponent } from './TransactionForm/transactionForm.component';
import { TransactionItemComponent } from './TransactionItem/transactionItem.component';
import { TransactionListComponent } from './TransactionList/transactionList.component';
import { ArrowUpIconComponent } from '@assets/icons/ArrowUpIcon';
import { ArrowDownIconComponent } from '@assets/icons/ArrowDownIcon';
import { PlusIconComponent } from '@assets/icons/PlusIcon';
import { SpinnerIconComponent } from '@assets/icons/SpinnerIcon';
import { EyeIconComponent } from '@assets/icons/EyeIcon';
import { EyeSlashIconComponent } from '@assets/icons/EyeSlashIcon';
import { CheckCircleIconComponent } from '@assets/icons/CheckCircleIcon';
import { NotificationComponent } from './Notification/notification.component';
import { DashboardComponent } from './Dashboard/dashboard.component';
import { SpinnerComponent } from './Spinner/spinner.component';
import { AccessDeniedComponent } from './Access-denied/access-denied.component';
import { IconInjectorDirective } from '../directives/icon-injector.directive';
import { NavMenuComponent } from './NavMenu/nav-menu.component'
@NgModule({
  declarations: [
    SheetConnectorComponent,
    SummaryComponent,
    TransactionFormComponent,
    TransactionItemComponent,
    TransactionListComponent,
    NotificationComponent,
    DashboardComponent,
    SpinnerComponent,
    AccessDeniedComponent,
    NavMenuComponent,
    
    ArrowUpIconComponent,
    ArrowDownIconComponent,
    PlusIconComponent,
    SpinnerIconComponent,
    EyeIconComponent,
    CheckCircleIconComponent,
    EyeSlashIconComponent
  ],
  imports: [
    CommonModule,FormsModule,
    NgFor, NgIf, NgClass,
    CurrencyPipe, DatePipe,    
    IconInjectorDirective
  ],
  exports: [
    SheetConnectorComponent,
    SummaryComponent,
    TransactionFormComponent,
    TransactionItemComponent,
    TransactionListComponent,
    NotificationComponent,
    DashboardComponent,
    SpinnerComponent,
    AccessDeniedComponent,
    NavMenuComponent
  ]
})
export class SharedModule { }
