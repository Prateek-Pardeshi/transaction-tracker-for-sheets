import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GoogleSheetsService } from '@services/googleSheetService.service'

@Component({
  selector: 'app-access-denied',
  standalone: false,
  templateUrl: './access-denied.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessDeniedComponent {

  constructor(private sheetsService: GoogleSheetsService) { }

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
