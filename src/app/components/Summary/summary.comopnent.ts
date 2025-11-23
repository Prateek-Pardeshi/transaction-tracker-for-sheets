import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { TransactionType, Duration } from '@assets/Entities/enum';

@Component({
  selector: 'app-summary',
  standalone: false,
  templateUrl: './summary.component.html',
})

export class SummaryComponent implements OnChanges {
  @Input() transactions: Transaction[] = [];

  showSummary: boolean = false;
  duration: string = Duration.YEARLY;
  totalIncome: number = 0;
  totalExpense: number = 0;
  balance: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions']) {
      this.calculateSummary();
    }
  }

  private calculateSummary(): void {
    let tempTransactions = this.transactions;
    if (this.duration === Duration.DAILY || this.duration === Duration.MONTHLY) {
      const currentDate = new Date().getDate();
      const currentMonth = new Date().getMonth();
      tempTransactions = this.transactions.filter(t => {
        const txDate = new Date(t.date || '');
        return this.duration === Duration.DAILY ? 
        txDate.getDate() === currentDate : 
        txDate.getMonth() === currentMonth;
      });
    }
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
}