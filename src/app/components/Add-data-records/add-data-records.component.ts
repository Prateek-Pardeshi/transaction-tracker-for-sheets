import { Transaction, TransactionMetadata } from '@/assets/Entities/types';
import { NotificationStyle, NotificationType, TransactionConstants } from '@assets/Entities/enum';
import { Component, Inject, Injector, OnInit, ViewChild } from '@angular/core';
import { FirebaseDataService } from '@/app/services/firebaseData.service';
import { NotificationService } from '@services/notification.service';
import { SpinnerService } from '@services/spinner.service';
import { TransactionFormComponent } from '../TransactionForm/transactionForm.component';
import { GoogleSheetsService } from '@/app/services/googleSheetService.service';
import { ConfigService } from '@/app/services/config.service';
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
  name = new Date().getFullYear().toString();
  isVisible = false;
  transactions: Transaction[] = [];
  metadata: TransactionMetadata = new TransactionMetadata()
  isSaving: boolean = false;

  get dataService(): FirebaseDataService { return this.injector.get(FirebaseDataService) }
  get sheetService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService) }
  get notificationService(): NotificationService { return this.injector.get(NotificationService); }
  get SpinnerService(): SpinnerService { return this.injector.get(SpinnerService); }
  get configService(): ConfigService { return this.injector.get(ConfigService); }

  ngOnInit(): void {
    this.loadData();
    this.fetchMetadata();
    this.copySheetURL = this.configService.config.COPY_SHEET_URL;
  }

  loadData() {
    this.SpinnerService.startSpinner();
    this.dataService.getTransactions(TransactionConstants.COLLECTION_RECURRING_TRANSACTION)
      .subscribe((data: Transaction[]) => {
        this.transactions = data;
        this.transactions.forEach(item => {
          if (item["date"] && new Date(item.date))
            item.date = this.sheetService.formatDate(item.date)
        })
        this.transactions = this.transactions.sort((a, b) =>
          this.sheetService.parseDate(b.date).getTime() - this.sheetService.parseDate(a.date).getTime()
        );
        this.dataService.transactionsSubject.next(this.transactions);
        this.SpinnerService.stopSpinner();
      });
  }

  fetchMetadata(): void {
    this.SpinnerService.startSpinner();
    if (this.configService.config) {
      this.metadata = this.configService.config;
      this.SpinnerService.stopSpinner();
    } else {
      this.dataService.getTransactions(TransactionConstants.COLLECTION_TRANSACTION_METADATA)
        .subscribe((data: any) => {
          this.metadata = data;
          this.SpinnerService.stopSpinner();
        });
    }
  }

  updateMetadata() {
    this.SpinnerService.startSpinner();
    const collectionRef = `${TransactionConstants.COLLECTION_TRANSACTION_METADATA}/${this.configService.config.DOCUMENT_ID}`;
    const obj = Object.entries(this.configService.config).map((x)=>{ return x});
    let metadata = {};
    obj.forEach((item)=>{
      metadata[item[0].toString().toLowerCase()] = item[1];
    })
    this.dataService.updateData(collectionRef, metadata).then(() => {
      this.SpinnerService.stopSpinner();
    });
  }

  copyAndCreateSheet() {
    if (!this.copySheetURL) return;
    this.SpinnerService.startSpinner()
    this.sheetService.copySheetFromUrl(this.copySheetURL, this.name).subscribe(() => {
      this.SpinnerService.stopSpinner();
      this.notificationService.open(NotificationStyle.TOAST, `${this.name} Google Sheet Created`, NotificationType.SUCCESS);
    });
  }

  addRecurringTransaction(transaction: Transaction): void {
    this.SpinnerService.startSpinner();
    this.dataService.addTransaction(transaction).then(() => {
      this.transactions.unshift(transaction);
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

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}

