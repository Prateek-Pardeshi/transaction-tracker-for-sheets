import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './components/shared.module';

// import { GoogleSheetsService } from './components/GoogleSheetService/GoogleSheetService.service';
// import { SummaryComponent } from './components/Summary/Summary.comopnent';
// import { TransactionFormComponent } from './components/TransactionForm/TransactionForm.component';
// import { TransactionListComponent } from './components/TransactionList/TransactionList.component';
// import { SheetConnectorComponent } from './components/SheetConnector/SheetConnector.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    AppRoutingModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'en-IN' }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}