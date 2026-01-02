import { ChangeDetectorRef, Component, Inject, Injector, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { GoogleSheetsService } from '@services/googleSheetService.service';
import { FirebaseDataService } from '@services/firebaseData.service';
import { Subscription } from 'rxjs';
import { TransactionType } from '@/assets/Entities/enum';
import { ConfigService } from '@/app/services/config.service';
@Component({
  selector: 'app-transaction-list',
  standalone: false,
  templateUrl: './transactionList.component.html',
})
export class TransactionListComponent implements OnInit, OnDestroy {
  @ViewChild('filterContainer', { static: true, read: ViewContainerRef })
  filterContainerRef!: ViewContainerRef;

  @ViewChild('filterTemplate', { static: true })
  filterTemplateRef!: TemplateRef<any>;

  constructor(@Inject(Injector) private injector: Injector, private cdr: ChangeDetectorRef) { }

  @Input() transactions: Transaction[] = [];
  @Input() showFilters: boolean = true;

  filteredRecords: Transaction[] = [];
  storedRecords: Transaction[] = [];

  get sheetService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService) }
  get dataService(): FirebaseDataService { return this.injector.get(FirebaseDataService) }
  get configServices(): ConfigService { return this.injector.get(ConfigService) }
  get currentCategories(): string[] {
    return this.type === TransactionType.EXPENSE ? this.configServices.config.EXPENSE_CATEGORIES : this.configServices.config.INCOME_CATEGORIES;
  }

  private subscription!: Subscription;
  private dataServiceSubscription!: Subscription;
  private pageDetails = {
    currentPage: 1,
    totalPages: 0,
    pageSize: [5, 10, 15, 20],
    maxRecords: 5,
    recordsList: [],
    lastRecordPage: 5,
    flow: 'next'
  };

  private description: string = '';
  private type: TransactionType = TransactionType.EXPENSE;
  private category: string;
  private fromDate: string = "";
  private toDate: string = "";

  appliedFilters: any = {
    showAppliedFilters: false,
    description: '',
    type: '',
    category: '',
    fromDate: '',
    toDate: ''
  };

  private TransactionType = TransactionType;
  private expenseCategories = ["", ...this.configServices.config.EXPENSE_CATEGORIES];
  private incomeCategories = ["", ...this.configServices.config.INCOME_CATEGORIES];

  ngOnInit(): void {
    this.applyPagination();
    this.subscription = this.sheetService.transactionsSubject.subscribe((data: Transaction[]) => {
      this.storedRecords = data && data.length ? data : [];
      this.applyPagination();
      this.cdr.detectChanges();
    });
    this.dataServiceSubscription = this.dataService.transactionsSubject.subscribe((data: Transaction[]) => {
      this.storedRecords = data && data.length ? data : [];
      this.applyPagination();
      this.cdr.detectChanges();
    });
  }

  trackById(index: number, transaction: Transaction): string {
    return transaction.id;
  }

  onPageSizeChange(): void {
    this.pageDetails.currentPage = 1;
    this.applyPagination();
  }

  applyPagination(): void {
    if(this.storedRecords && this.storedRecords.length == 0) return;
    const start = (this.pageDetails.currentPage - 1) * Number(this.pageDetails.maxRecords);
    const end = Number(start )+ Number(this.pageDetails.maxRecords);
    this.filteredRecords = this.storedRecords.slice(start, end);
    this.pageDetails.totalPages = Number(Math.ceil(this.storedRecords.length / this.pageDetails.maxRecords));
    this.pageDetails.recordsList = Array.from({ length: this.pageDetails.totalPages }, (_, i) => i + 1);
    this.pageDetails.recordsList.length > 0 && this.setRecordList();
  }

  setRecordList() {
    if (this.pageDetails.totalPages <= 5) {
      this.pageDetails.recordsList = Array.from({ length: this.pageDetails.totalPages }, (_, i) => i + 1);
    } else {
      const start = Number(this.pageDetails.currentPage);
      let end = Number(this.pageDetails.lastRecordPage) > Number(this.pageDetails.totalPages) ? Number(this.pageDetails.totalPages) : Number(this.pageDetails.lastRecordPage) + 4;
      end = end < 5 ? end : (start == 1 ? 5 : end);
      this.pageDetails.recordsList = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      this.pageDetails.flow == "next" && start != end && this.pageDetails.recordsList.push("...");
      this.pageDetails.flow == "prev" && start != end && this.pageDetails.recordsList.unshift("...");
    }
  }

  goToPage(page, flow = "next"): void {
    this.pageDetails.flow = flow;
    if (page === '...') {
      this.pageDetails.lastRecordPage += 5;
      this.setRecordList();
      page = this.pageDetails.recordsList[0];
    }
    this.pageDetails.currentPage = Number(page);
    if (page < 1 || page > this.pageDetails.totalPages) return;
    this.pageDetails.lastRecordPage = this.pageDetails.currentPage;
    this.applyPagination();
  }

  openFilterPopup(): void {
    if (this.filterContainerRef) {
      this.filterContainerRef.clear();
      this.filterContainerRef.createEmbeddedView(this.filterTemplateRef);
    }
  }

  openAppliedFilters(): void {
    this.description = this.appliedFilters.description;
    this.type = this.appliedFilters.type;
    this.category = this.appliedFilters.category;
    this.fromDate = this.appliedFilters.fromDate;
    this.toDate = this.appliedFilters.toDate;
    this.openFilterPopup();
  }

  closePopUp(): void {
    this.category = "";
    this.description = "";
    this.fromDate = "";
    this.toDate = "";
    if (this.filterContainerRef) {
      this.filterContainerRef.clear();
    }
  }

  applyFilters(): void {
    this.appliedFilters.showAppliedFilters = !!(this.description || this.type || this.category || this.fromDate || this.toDate);
    this.appliedFilters.description = this.description;
    this.appliedFilters.type = this.type;
    this.appliedFilters.category = this.category;
    this.appliedFilters.fromDate = this.fromDate;
    this.appliedFilters.toDate = this.toDate;
    this.storedRecords = this.transactions.filter((transaction) => {
      const matchesDescription = this.description ? transaction.description.toLowerCase().includes(this.description.toLowerCase()) : true;
      const matchesType = this.type ? transaction.type === this.type : true;
      const matchesCategory = this.category ? transaction.category === this.category : true;
      const transactionDate = this.parseDate(transaction.date);
      const matchesFromDate = this.fromDate ? transactionDate.setHours(0, 0, 0, 0) >= new Date(this.fromDate).setHours(0, 0, 0, 0) : true;
      const matchesToDate = this.toDate ? transactionDate.setHours(0, 0, 0, 0) <= new Date(this.toDate).setHours(0, 0, 0, 0) : true;

      return matchesDescription && matchesType && matchesCategory && matchesFromDate && matchesToDate;
    });
    this.pageDetails.currentPage = 1;
    this.applyPagination();
    this.closePopUp();
  }

  resetFilters(): void {
    this.appliedFilters.showAppliedFilters = false;
    this.appliedFilters.description = '';
    this.appliedFilters.type = '';
    this.appliedFilters.category = '';
    this.appliedFilters.fromDate = '';
    this.appliedFilters.toDate = '';
    this.description = '';
    this.type = TransactionType.EXPENSE;
    this.category = '';
    this.fromDate = '';
    this.toDate = '';
    this.storedRecords = this.transactions;
    this.pageDetails.currentPage = 1;
    this.applyPagination();
    this.closePopUp();
  }

  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.dataServiceSubscription.unsubscribe();
  }
}