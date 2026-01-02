import { TransactionType } from './enum'

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  color?: string;
}

export interface SheetDetails {
  sheetURL: string;
  sheetId: string;
  sheetName: string;
}

export interface StaticObject {
  id: number;
  name: string;
}

export class TransactionMetadata {
  COPY_SHEET_URL : string = "";
  DEFAULT_SHEET_URL : string = "";
  SCOPE : string = "";
  TOKEN_SCOPE : string = "";
  DISCOVERY_DOC : string = "";
  VALIDATE_TOKEN_URL : string = "";
  TOKEN_URL : string = "";
  ADD_TRANSACTION_URL : string = "";
  FETCH_TRANSACTION_URL : string = "";
  INCOME_QUERY : string = "";
  EXPENSE_QUERY : string = "";
  DOCUMENT_ID : string = "";
  EXPENSE_CATEGORIES : string[] = [];
  INCOME_CATEGORIES : string[] = [];
  MONTH : StaticObject[] = [];
}