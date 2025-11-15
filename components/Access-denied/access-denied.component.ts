import { Component, Inject, Injector } from '@angular/core';
import { GoogleSheetsService } from '../GoogleSheetService/googleSheetService.service'

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html'
})
export class AccessDeniedComponent {

  constructor(@Inject(Injector) private inject: Injector, private sheetService: GoogleSheetsService) { }

  get sheetsService(): GoogleSheetsService { return this.inject.get(GoogleSheetsService); }

  goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      window.location.href = '/';
    }
  }

  login() {
    this.sheetsService && this.sheetsService.signIn();
  }
}
