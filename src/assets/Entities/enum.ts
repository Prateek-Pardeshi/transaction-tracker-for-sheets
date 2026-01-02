export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum NotificationStyle {
  TOAST = 'toast',
  POPUP = 'pop-up',
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
}

export enum Duration {
  DAILY = 'Daily',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly'
}

export enum SheetURL {
  COPY_SHEET_URL = "https://docs.google.com/spreadsheets/d/1QGCR6XcHWil7ktWVXzVgrUg5a5NT7opas5xVvKNnEPw/edit?usp=sharing",
  DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1O04Xy-BcaByMxr7CDGm4nQFLMYwqqae7a8inrnysevY/edit?gid=1732160294#gid=1732160294",
  SHEET_FOLER_NAME = "Sheets"
}

export const TransactionConstants = {
  COLLECTION_RECURRING_TRANSACTION : "recurring_transactions",
  COLLECTION_TRANSACTION_METADATA : "transaction_metadata"
}