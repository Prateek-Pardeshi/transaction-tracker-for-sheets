import { Component, Input, OnInit } from '@angular/core';
import { Transaction } from '@assets/Entities/types';

@Component({
  selector: 'app-transaction-list',
  standalone: false,
  templateUrl: './transactionList.component.html',
})
export class TransactionListComponent implements OnInit{
  
  @Input() transactions: Transaction[] = [];

  filteredRecords: Transaction[] = [];
  private pageDetails = {
    currentPage: 1,
    totalPages: 0,
    pageSize: [5, 10, 15, 20],
    maxRecords: 5,
    recordsList:[],
    lastRecordPage: 5,
    flow: 'next'
  };

  ngOnInit(): void {
    this.applyPagination();    
  }

  trackById(index: number, transaction: Transaction): string {
    return transaction.id;
  }

  onPageSizeChange(): void {
    this.pageDetails.currentPage = 1;
    this.applyPagination();
  }

  applyPagination(): void {
    const start = (this.pageDetails.currentPage - 1) * this.pageDetails.maxRecords;
    const end = start + this.pageDetails.maxRecords;
    this.filteredRecords = this.transactions.slice(start, end);    
    this.pageDetails.totalPages = Math.ceil(this.transactions.length / this.pageDetails.maxRecords);
    this.pageDetails.recordsList = Array.from({ length: this.pageDetails.totalPages }, (_, i) => i + 1);
    this.pageDetails.recordsList.length > 0 && this.setRecordList();
  }

  setRecordList() {
    if(this.pageDetails.totalPages <= 5) {
      this.pageDetails.recordsList = Array.from({ length: this.pageDetails.totalPages }, (_, i) => i + 1);
    } else {
      const start = this.pageDetails.currentPage;
      const end = this.pageDetails.lastRecordPage > this.pageDetails.totalPages ? this.pageDetails.totalPages : this.pageDetails.lastRecordPage + 4;
      this.pageDetails.recordsList = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      this.pageDetails.flow == "next" && start != end && this.pageDetails.recordsList.push("...");
      this.pageDetails.flow == "prev" && start != end && this.pageDetails.recordsList.unshift("...");
    }
  }

  goToPage(page, flow = "next"): void {
    this.pageDetails.flow = flow;
    if(page === '...') {
      this.pageDetails.lastRecordPage += 5;
      this.setRecordList();
      page = this.pageDetails.recordsList[0];
    }
    this.pageDetails.currentPage = page;
    if (page < 1 || page > this.pageDetails.totalPages) return;
    this.pageDetails.lastRecordPage = this.pageDetails.currentPage;
    this.applyPagination();
  }
}