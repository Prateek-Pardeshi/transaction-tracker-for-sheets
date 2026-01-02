import { AfterViewInit, Component, EventEmitter, Inject, Injector, Input, OnInit, Output } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { TransactionType } from '@assets/Entities/enum';
import { ConfigService } from '@/app/services/config.service';

@Component({
  selector: 'app-transaction-form',
  standalone: false,
  templateUrl: './transactionForm.component.html',
})
export class TransactionFormComponent implements OnInit, AfterViewInit {
  @Input() isSaving: boolean = false;
  @Input() title: string = "Add New Transaction";
  @Output() addTransaction = new EventEmitter<Omit<Transaction, 'id'>>();

  description: string = '';
  type: TransactionType = TransactionType.EXPENSE;
  category: string = "";
  amount: number | null = null;
  date: string = new Date().toISOString().split('T')[0];

  TransactionType = TransactionType;
  filteredCategories: string[] = [];
  showSuggestions: boolean = false;

  constructor(@Inject(Injector) private injector: Injector) {}

  get configService(): ConfigService { return this.injector.get(ConfigService) }

  ngOnInit() {}

  ngAfterViewInit(): void {
    this.category = this.configService.config.EXPENSE_CATEGORIES[0];
  }

  get currentCategories(): string[] {
    return this.type === TransactionType.EXPENSE ? this.configService.config.EXPENSE_CATEGORIES : this.configService.config.INCOME_CATEGORIES;
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
    this.description = cat;
    this.filteredCategories = [];
    this.showSuggestions = false;
  }

  onBlur() {
    this.showSuggestions = false;
  }

  clearText(event, flag) {
    if(flag)
      this.description = ""; 
    else {
      this.category = ""; 
      this.filterCategories();
    }  
    event.currentTarget.previousSibling.focus()    
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
    this.category = this.configService.config.EXPENSE_CATEGORIES[0];
  }
}