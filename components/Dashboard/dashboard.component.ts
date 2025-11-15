import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { Transaction } from '../Assets/Entities/types';
import { GoogleSheetsService } from '../GoogleSheetService/googleSheetService.service';

import { TransactionFormComponent } from '../TransactionForm/transactionForm.component';
import { SheetConnectorComponent } from '../SheetConnector/sheetConnector.component';
import { NotificationService } from '../Notification/notification.service';
import { NotificationStyle, NotificationType } from '../Assets/Entities/enum';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerService } from '../Spinner/spinner.service';

const initialTransactions: Transaction[] = [];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit {
  @ViewChild(TransactionFormComponent) private txFormComponent!: TransactionFormComponent;
  @ViewChild(SheetConnectorComponent) private sheetConnectorComponent!: SheetConnectorComponent;

  transactions: Transaction[] = [];
  sheetUrl: string = '';
  isConnected: boolean = false;
  isConnecting: boolean = false;
  isSaving: boolean = false;
  data: any;

  constructor(
    private injector: Injector, 
    private router: Router, 
    private route: ActivatedRoute
  ) {
    this.loadFromLocalStorage();
  }

  get sheetsService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService); }
  get notificationService(): NotificationService { return this.injector.get(NotificationService); }
  get SpinnerService(): SpinnerService { return this.injector.get(SpinnerService); }

  ngOnInit(): void {    
    this.route.queryParams.subscribe(params => {
      if(params['code']) {
        this.sheetsService.handleAuthCallback(params['code']).subscribe((response: any) => {
          this.sheetsService.accessToken = response.access_token;
          localStorage.setItem('token', this.sheetsService.accessToken ? this.sheetsService.accessToken : '');
          this.notificationService.open(NotificationStyle.TOAST, 'Authentication successful! You can now connect your Google Sheet.', NotificationType.SUCCESS, 4000);
        });
      } else {
        this.sheetsService.handleSheetConnection();
        this.sheetsService.fetchTransactions();
      }
    });
    // !this.sheetsService.accessToken && this.sheetsService.signIn();
    // this.sheetsService.handleSheetConnection();
    // this.sheetsService.fetchTransactions();
  }

  private loadFromLocalStorage(): void {
    this.sheetsService.accessToken = localStorage.getItem('token') ? localStorage.getItem('token') : null;
    const storedTransactions = localStorage.getItem('transactions');
    this.transactions = storedTransactions ? JSON.parse(storedTransactions) : initialTransactions;
  }

  handleConnectSheet(url: string): void {
    if (!url) return;
    this.isConnecting = true;
    this.SpinnerService.startSpinner();
    new Promise<void>((resolve) => {
      this.sheetUrl = url;
        this.isConnected = true;
        this.sheetsService.sheetDetails.sheetURL = url;
        localStorage.setItem('sheetURL', url);
        this.sheetsService.handleSheetConnection();
        this.sheetsService.fetchTransactions();
        this.SpinnerService.stopSpinner();
        this.notificationService.open(NotificationStyle.POPUP, 'Successfully connected to sheet! Transactions will now be saved.', NotificationType.SUCCESS, 4000);
        resolve();
    }).then(() => {
      if (this.sheetConnectorComponent) {
        this.sheetConnectorComponent.isVisible = false;
      }
    }).finally(() => {
      this.isConnecting = false;
    });
  }

  handleAddTransaction(transaction: Transaction): void {
    this.isSaving = true;
    this.notificationService.open(NotificationStyle.TOAST, 'Saving transaction...', NotificationType.INFO, 1000);
    this.SpinnerService.startSpinner();
    new Promise<void>((resolve) => {      
      this.sheetsService.addTransaction(transaction).subscribe(() => {
          this.transactions.push(transaction);
          localStorage.setItem('transactions', JSON.stringify(this.transactions));
          this.SpinnerService.stopSpinner();
          this.notificationService.open(NotificationStyle.TOAST, 'Transaction Added!', NotificationType.INFO, 1500);
        }
      );
      resolve();
    }).finally(() => {
      this.isSaving = false;
      if (this.txFormComponent) {
        this.txFormComponent.resetForm();
      }
    });
  }
}