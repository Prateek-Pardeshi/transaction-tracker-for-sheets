import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { GoogleSheetsService } from '@services/googleSheetService.service';

import { TransactionFormComponent } from '../TransactionForm/transactionForm.component';
import { SheetConnectorComponent } from '../SheetConnector/sheetConnector.component';
import { NotificationService } from '@services/notification.service';
import { NotificationStyle, NotificationType } from '@assets/Entities/enum';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerService } from '@services/spinner.service';
import { Subscription } from 'rxjs';

const initialTransactions: Transaction[] = [];

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(TransactionFormComponent) private txFormComponent!: TransactionFormComponent;
  @ViewChild(SheetConnectorComponent) private sheetConnectorComponent!: SheetConnectorComponent;

  transactions: Transaction[] = [];
  sheetUrl: string = '';
  isConnected: boolean = false;
  isConnecting: boolean = false;
  isSaving: boolean = false;
  data: any;
  transactionsSubscription!: Subscription;

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
    this.route.queryParamMap.subscribe(params => {
      if (params.get('code')) {
        this.sheetsService.handleAuthCallback(params.get('code')).subscribe({
          next: (response: any) => {
            this.sheetsService.storeToken(response);
            this.notificationService.open(NotificationStyle.TOAST, 'Authentication successful! You can now connect your Google Sheet.', NotificationType.SUCCESS, 4000);
            this.sheetsService.handleSheetConnection();
            this.sheetsService.fetchTransactions();
          },
          error: (error) => {
            this.notificationService.open(NotificationStyle.POPUP, error.message, NotificationType.ERROR);
          }
        });
      } else {
        this.sheetsService.handleSheetConnection();
        this.sheetsService.fetchTransactions();
      }
    });
    this.transactionsSubscription = this.sheetsService.transactionsSubject.subscribe((data: Transaction[]) => {
      this.transactions = data && data.length > 0 ? data : this.transactions;
    });
  }

  private loadFromLocalStorage(): void {
    this.sheetsService.accessToken = localStorage.getItem('token') ? localStorage.getItem('token') : null;
    const storedTransactions = localStorage.getItem('transactions');
    this.transactions = storedTransactions ? JSON.parse(storedTransactions) : initialTransactions;
  }

  handleConnectSheet(event: any, type: string): void {
    if (!event) return;
    this.isConnecting = true;
    this.SpinnerService.startSpinner();
    new Promise<void>((resolve) => {
      if (type === 'create') {
        this.sheetsService.copySheetFromUrl(event.url, event.name).subscribe({
          next: (response) => {
            response;
            return;
          },
          error: (error) => {
            this.notificationService.open(NotificationStyle.POPUP, error, NotificationType.ERROR)
          }
        });
      } else {
        this.connectToSheet(event)
      }

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
      this.sheetsService.addTransaction(transaction).subscribe({
        next: (resonse) => {
          if (resonse != null) {
            this.transactions.push(transaction);
            this.sheetsService.transactionsSubject.next(this.transactions);
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
            this.notificationService.open(NotificationStyle.TOAST, 'Transaction Added!', NotificationType.SUCCESS, 1500);
          }
        },
        error: (err) => {
          this.notificationService.open(NotificationStyle.POPUP, err.message ? err.message : err, NotificationType.ERROR);
        }
      });
      resolve();
    })
      .finally(() => {
        this.SpinnerService.stopSpinner();
        this.isSaving = false;
        if (this.txFormComponent) {
          this.txFormComponent.resetForm();
        }
      });
  }

  connectToSheet(url) {
    this.sheetUrl = url;
    this.isConnected = true;
    this.sheetsService.sheetDetails.sheetURL = url;
    localStorage.setItem('sheetURL', url);
    this.sheetsService.handleSheetConnection();
    this.sheetsService.fetchTransactions();
    this.SpinnerService.stopSpinner();
    this.notificationService.open(NotificationStyle.TOAST, 'Successfully connected to sheet! Transactions will now be saved.', NotificationType.SUCCESS, 4000);
  }

  ngOnDestroy(): void {
    this.transactionsSubscription.unsubscribe();
  }
}