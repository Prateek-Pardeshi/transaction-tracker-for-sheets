import { Component, Inject, Injector, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { TransactionType, Duration } from '@assets/Entities/enum';
import { GoogleSheetsService } from '@services/googleSheetService.service';
import _ from 'lodash';
import { ConfigService } from '@/app/services/config.service';
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
  finalTotalIncome: number = 0;
  finalTotalExpense: number = 0;
  finalBalance: number = 0;
  viewSummary: boolean = true;
  months = [];
  month: any = new Date().getMonth() + 1;

  get googleService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService) }
  get configService(): ConfigService { return this.injector.get(ConfigService) }

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
    let tempTransactions = _.cloneDeep(this.transactions);
    if (this.duration === Duration.DAILY || this.duration === Duration.MONTHLY) {
      const currentDate = new Date().getDate();
      const currentMonth = this.month.id;
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

    this.showSummary && this.showHideSummary(this.showSummary);
  }

  showHideSummary(show: boolean): void {
    this.showSummary = show;
    this.animateCount(this.showSummary ? this.totalIncome : 0, 'income');
    this.animateCount(this.showSummary ? this.totalExpense : 0, 'expense');
    this.animateCount(this.showSummary ? this.balance : 0, 'balance');
  }

  animateCount(target: number, flag: string) {
    let start = 0;
    const startTime = performance.now();
    [this.finalTotalIncome, this.finalTotalExpense, this.finalBalance] = [0, 0, 0];

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / 1200, 1) < 0 ? Math.min((time - startTime) / 1200, 1) * -1 : Math.min((time - startTime) / 1200, 1);
      switch (flag) {
        case 'income':
          start = !this.showSummary ? this.totalIncome : 0;
          this.finalTotalIncome = this.calulateProogress(progress, target, start);
          break;
        case 'expense':
          start = !this.showSummary ? this.totalExpense : 0;
          this.finalTotalExpense = this.calulateProogress(progress, target, start);
          break;
        case 'balance':
          start = !this.showSummary ? this.balance : 0;
          this.finalBalance = this.calulateProogress(progress, target, start);
          break;
      }
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  calulateProogress(progress: number, target: number, start: number): number {
    return !this.showSummary ? Math.floor(start * (1 - progress)) : Math.floor(progress * (target - start) + start);
  }

  showSummaryDurationWise(): void {
    if (this.duration === "Monthly" && (!this.months || this.months.length == 0) ) {
      this.months = this.configService.config.MONTH;
      this.month = this.months ? this.months[new Date().getMonth()] : this.month;
    }
    this.calculateSummary();
  }

  setView(showChart: boolean): void {
    this.viewSummary = showChart;
    this.viewContainerRef && this.viewContainerRef.clear()
    this.viewSummary ? this.viewContainerRef.createEmbeddedView(this.summaryTemplateTemplateRef) :
      this.viewContainerRef.createEmbeddedView(this.chartTemplateTemplateRef);
  }
}