import { NgModule } from '@angular/core';
import { CommonModule, NgFor, NgIf, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SheetConnectorComponent } from './SheetConnector/sheetConnector.component';
import { SummaryComponent } from './Summary/summary.comopnent';
import { TransactionFormComponent } from './TransactionForm/transactionForm.component';
import { TransactionItemComponent } from './TransactionItem/transactionItem.component';
import { TransactionListComponent } from './TransactionList/transactionList.component';
import { ArrowUpIconComponent } from './Assets/icons/ArrowUpIcon';
import { ArrowDownIconComponent } from './Assets/icons/ArrowDownIcon';
import { PlusIconComponent } from './Assets/icons/PlusIcon';
import { SpinnerIconComponent } from './Assets/icons/SpinnerIcon';
import { EyeIconComponent } from './Assets/icons/EyeIcon';
import { EyeSlashIconComponent } from './Assets/icons/EyeSlashIcon';
import { CheckCircleIconComponent } from './Assets/icons/CheckCircleIcon';
import { NotificationComponent } from './Notification/notification.component';
import { DashboardComponent } from './Dashboard/dashboard.component';
import { SpinnerComponent } from './Spinner/spinner.component';
import { AccessDeniedComponent } from './Access-denied/access-denied.component';
@NgModule({
  declarations: [
    SheetConnectorComponent,
    SummaryComponent,
    TransactionFormComponent,
    TransactionItemComponent,
    TransactionListComponent,
    ArrowUpIconComponent,
    ArrowDownIconComponent,
    PlusIconComponent,
    SpinnerIconComponent,
    EyeIconComponent,
    CheckCircleIconComponent,
    EyeSlashIconComponent,
    NotificationComponent,
    DashboardComponent,
    SpinnerComponent,
    AccessDeniedComponent
  ],
  imports: [
    CommonModule,FormsModule,
    NgFor, NgIf, NgClass,
    CurrencyPipe, DatePipe
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
    AccessDeniedComponent
  ]
})
export class SharedModule { }
