import { Component, Inject, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { TransactionType } from '@assets/Entities/enum';
import { GoogleSheetsService } from '@services/googleSheetService.service';

import { TransactionFormComponent } from '../TransactionForm/transactionForm.component';
import { SheetConnectorComponent } from '../SheetConnector/sheetConnector.component';
import { NotificationService } from '@services/notification.service';
import { NotificationStyle, NotificationType } from '@assets/Entities/enum';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerService } from '@services/spinner.service';
import { ConfigService } from '@services/config.service';
import { resolve } from 'path';

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

  constructor(@Inject(Injector) private injector: Injector) {
    this.sheetsService.accessToken = localStorage.getItem('token') ? localStorage.getItem('token') : null;
  }

  get sheetsService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService); }
  get notificationService(): NotificationService { return this.injector.get(NotificationService); }
  get SpinnerService(): SpinnerService { return this.injector.get(SpinnerService); }
  get configService(): ConfigService { return this.injector.get(ConfigService); }

  ngOnInit(): void {
    this.SpinnerService.startSpinner(false);
    this.loadTransactionData();
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
      this.sheetsService.addTransaction(transaction, this.transactions).subscribe({
        next: (resonse) => {
          if (resonse != null) {
            this.transactions.unshift(transaction);
            this.sheetsService.transactionsSubject.next(this.transactions);
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
    this.loadTransactionData();
    this.notificationService.open(NotificationStyle.TOAST, 'Successfully connected to sheet! Transactions will now be saved.', NotificationType.SUCCESS, 4000);
  }

  loadTransactionData(): void {
    this.sheetsService.handleSheetConnection();
    this.sheetsService.fetchTransactions().subscribe(([incomeRes, expenseRes]) => {
      const incomeJson = JSON.parse(incomeRes.substring(47).slice(0, -2));
      const expenseJson = JSON.parse(expenseRes.substring(47).slice(0, -2));

      let idata = incomeJson.table.rows.map((r: any, index) => ({
        id: index + 1,
        date: r.c[0]?.f,
        amount: r.c[1]?.v,
        description: r.c[2]?.v,
        category: r.c[3]?.v,
        type: TransactionType.INCOME
      }));
      let edata = expenseJson.table.rows.map((r: any, index) => ({
        id: index + 1,
        date: r.c[0]?.f,
        amount: r.c[1]?.v,
        description: r.c[2]?.v,
        category: r.c[3]?.v,
        type: TransactionType.EXPENSE
      }));

      this.transactions = [...idata, ...edata];
      if (this.transactions && this.transactions.length > 0)
        this.transactions = this.transactions.sort((a, b) =>
          this.sheetsService.parseDate(b.date).getTime() - this.sheetsService.parseDate(a.date).getTime()
        );
      this.SpinnerService.stopSpinner();
    });
  }

  ngOnDestroy(): void { }
}