import { Component, Input } from '@angular/core';
import { Transaction } from '../Assets/Entities/types';
import { TransactionType } from '../Assets/Entities/enum';

@Component({
  selector: 'app-transaction-item',
  templateUrl: './transactionItem.component.html',
})
export class TransactionItemComponent {
  @Input() transaction!: Transaction;

  get isIncome(): boolean {
    return this.transaction.type === TransactionType.INCOME;
  }

  get amountColor(): string {
    return this.isIncome ? 'text-green-500' : 'text-red-500';
  }

  get iconBgColor(): string {
    return this.isIncome ? 'bg-green-100' : 'bg-red-100';
  }
}