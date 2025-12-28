import { Component, Inject, Injector, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { TransactionType, Duration } from '@assets/Entities/enum';
import { GoogleSheetsService } from '@services/googleSheetService.service';
@Component({
  selector: 'app-summary',
  standalone: false,
  templateUrl: './summary.component.html',
})

export class SummaryComponent implements OnInit, OnChanges {
  @Input() transactions: Transaction[] = [];

  @ViewChild('viewContainer', { static: true, read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  @ViewChild('summaryTemplate', { static: true }) summaryTemplateTemplateRef!: TemplateRef<any>;
  @ViewChild('chartTemplate', { static: true }) chartTemplateTemplateRef!: TemplateRef<any>;

  constructor(@Inject(Injector) private injector: Injector) { }

  showSummary: boolean = false;
  duration: string = Duration.YEARLY;
  totalIncome: number = 0;
  totalExpense: number = 0;
  balance: number = 0;
  viewSummary: boolean = true;

  get googleService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService) }

  ngOnInit(): void {
    this.setView(this.viewSummary);
    this.calculateSummary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions']) {
      this.calculateSummary();
    }
  }

  private calculateSummary(): void {
    let tempTransactions = [];
    if (this.duration === Duration.DAILY || this.duration === Duration.MONTHLY) {
      const currentDate = new Date().getDate();
      const currentMonth = new Date().getMonth() + 1;
      tempTransactions = this.transactions.filter(t => {
        const [day, month, year] = (t.date || '').split('/').map(Number);
        const txDate = new Date(year, month - 1, day);
        return this.duration === Duration.DAILY ?
          txDate.getDate() === currentDate :
          txDate.getMonth() + 1 === currentMonth;
      });
    }
    
    this.googleService.transactionsSubject.next(tempTransactions);

    this.totalIncome = tempTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    this.totalExpense = tempTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    this.balance = this.totalIncome - this.totalExpense;
  }

  showHideSummary(show: boolean): void {
    this.showSummary = show;
  }

  showSummaryDurationWise(): void {
    this.calculateSummary();
  }

  setView(showChart: boolean): void {
    this.viewSummary = showChart;
    this.viewContainerRef && this.viewContainerRef.clear()
    this.viewSummary ? this.viewContainerRef.createEmbeddedView(this.summaryTemplateTemplateRef) :
      this.viewContainerRef.createEmbeddedView(this.chartTemplateTemplateRef);
  }
}