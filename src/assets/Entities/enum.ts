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
  DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1O04Xy-BcaByMxr7CDGm4nQFLMYwqqae7a8inrnysevY/edit?gid=1732160294#gid=1732160294"
}

export const TransactionConstants = {
  SCOPE : "https://www.googleapis.com/auth/spreadsheets",
  TOKEN_SCOPE : "https://www.googleapis.com/auth/calendar.readonly",
  DISCOVERY_DOC : "https://sheets.googleapis.com/$discovery/rest?version=v4",
  VALIDATE_TOKEN_URL : "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=_TOKEN_",
  TOKEN_URL : "https://oauth2.googleapis.com/token",
  ADD_TRANSACTION_URL : "https://sheets.googleapis.com/v4/spreadsheets/_SPREADSHEET_ID_/values/_RANGE_:append?valueInputOption=USER_ENTERED",
  FETCH_TRANSACTIONS_URL : "https://docs.google.com/spreadsheets/d/_SPREADSHEET_ID_/gviz/tq?sheet=_SHEET_NAME_&tq=",
  INCOME_QUERY : "select G, H, I, J where G is not null and H is not null and I is not null and J is not null",
  EXPENSE_QUERY : "select B, C, D, E where B is not null and C is not null and D is not null and E is not null",

  EXPENSE_CATEGORIES : ["Food", "Bike", "Petrol", "Home", "Mutual Fund", "Hair Cut", "LIC", "Utilities", "Diet", "Travel", "Debt", "Other", "Help", "Shopping", "Gifts", "Health/medical", "Party", "Personal"],
  INCOME_CATEGORIES : ['Savings', 'Paycheck', 'Bonus', 'Credit', 'Other', 'Help'],

  COLLECTION_NAME : "recurring_transactions"
}