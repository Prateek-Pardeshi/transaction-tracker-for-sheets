import { TransactionType } from './enum'

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
}

export interface SheetDetails {
  sheetURL: string;
  sheetId: string;
  sheetName: string;
  sheetData: Transaction[];
}