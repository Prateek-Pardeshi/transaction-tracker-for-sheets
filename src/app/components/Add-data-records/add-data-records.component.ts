import { Transaction } from '@/assets/Entities/types';
import { NotificationStyle, NotificationType } from '@assets/Entities/enum';
import { Component, Inject, Injector, OnInit, ViewChild } from '@angular/core';
import { FirebaseDataService } from '@/app/services/firebaseData.service';
import { NotificationService } from '@services/notification.service';
import { SpinnerService } from '@services/spinner.service';
import { TransactionFormComponent } from '../TransactionForm/transactionForm.component';
@Component({
  selector: 'app-add-data-records',
  standalone: false,
  templateUrl: './add-data-records.component.html'
})
export class AddDataRecordsComponent implements OnInit {
  @ViewChild(TransactionFormComponent) private txFormComponent!: TransactionFormComponent;

  constructor(@Inject(Injector) private injector: Injector) { }

  isConnected = false;
  sheetUrl = '';
  isCopyingDone = false;
  copySheetURL = '';
  isVisible = false;
  transactions: Transaction[] = [];
  isSaving: boolean = false;

  get dataService(): FirebaseDataService { return this.injector.get(FirebaseDataService) }
  get notificationService(): NotificationService { return this.injector.get(NotificationService); }
  get SpinnerService(): SpinnerService { return this.injector.get(SpinnerService); }

  

  ngOnInit(): void {
    this.loadData();
  }

  toggleVisibility(): void {
    this.isVisible = !this.isVisible;
  }

  loadData() {
    this.SpinnerService.startSpinner();
    this.dataService.getTransactions().subscribe((data: Transaction[]) => {
      this.transactions = data;
      this.dataService.transactionsSubject.next(this.transactions);
      this.SpinnerService.stopSpinner();
    });
  }

  copyAndCreateSheet(): void { }

  addRecurringTransaction(transaction: Transaction): void {
    this.SpinnerService.startSpinner();
    this.dataService.addTransaction(transaction).then(() => {
      this.transactions.push(transaction);
      this.dataService.transactionsSubject.next(this.transactions);
      this.SpinnerService.stopSpinner();
      this.notificationService.open(NotificationStyle.TOAST, "Record Added Successfully", NotificationType.SUCCESS)
    })
    .finally(() => {
      this.SpinnerService.stopSpinner();
      this.isSaving = false;
        if (this.txFormComponent) {
          this.txFormComponent.resetForm();
        }
    });
  }

}

