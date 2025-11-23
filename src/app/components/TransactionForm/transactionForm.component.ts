import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { TransactionType } from '@assets/Entities/enum';

@Component({
  selector: 'app-transaction-form',
  standalone: false,
  templateUrl: './transactionForm.component.html',
})
export class TransactionFormComponent implements OnInit {
  @Input() isSaving: boolean = false;
  @Output() addTransaction = new EventEmitter<Omit<Transaction, 'id'>>();

  description: string = '';
  type: TransactionType = TransactionType.EXPENSE;
  category: string;
  amount: number | null = null;
  date: string = new Date().toISOString().split('T')[0];

  TransactionType = TransactionType;
  expenseCategories = ['Food', 'Bike', 'Petrol', 'Home', 'Mutual Fund', 'Hair Cut', 'LIC', 'Utilities', 'Diet', 'Travel', 'Debt', 'Other', 'Help', 'Shopping', 'Gifts', 'Health/medical', 'Party', 'Personal'];
  incomeCategories = ['Savings', 'Paycheck', 'Bonus', 'Credit', 'Other', 'Help'];
  filteredCategories: string[] = [];
  showSuggestions: boolean = false;

  constructor() {
    this.category = this.expenseCategories[0];
    // this.description = this.category;
  }

  async ngOnInit() {
    // await this.sheetsService.init();
  }

  get currentCategories(): string[] {
    return this.type === TransactionType.EXPENSE ? this.expenseCategories : this.incomeCategories;
  }

  categoryChange(): void {
    // this.description = this.category;
  }

  handleTypeChange(): void {
    this.category = this.currentCategories[0];
  }

  filterCategories() {
    const query = this.category.toLowerCase();
    this.filteredCategories = this.currentCategories.filter(cat =>
      cat.toLowerCase().includes(query)
    );
    this.showSuggestions = true
  }

  selectCategory(cat: string) {
    this.category = cat;
    this.filteredCategories = [];
    this.categoryChange(); 
    this.showSuggestions = false;
  }

  onBlur() {
    // setTimeout(()=>{ this.showSuggestions = false; }, 1000);
    this.showSuggestions = false;
  }

  clearText(flag) {
    if(flag)
      this.description = ""; 
    else {
      this.category = ""; 
      this.filterCategories();
    }      
  }

  async handleSubmit() {
    if (!this.description || this.amount === null || !this.date || !this.category || this.isSaving) {
      return;
    }

    this.addTransaction.emit({
      date: this.date,
      amount: this.amount,
      description: this.description,
      category: this.category,
      type: this.type
    });
  }

  public resetForm(): void {
    this.description = '';
    this.amount = null;
    this.date = new Date().toISOString().split('T')[0];
    this.type = TransactionType.EXPENSE;
    this.category = this.expenseCategories[0];
  }
}