import { Component } from '@angular/core';

@Component({
  selector: 'app-add-data-records',
  standalone: false,
  templateUrl: './add-data-records.component.html'
})
export class AddDataRecordsComponent {

  isConnected = false;
  sheetUrl = '';
  isCopyingDone = false;
  copySheetURL = '';
  isVisible = false;

  toggleVisibility(): void {
    this.isVisible = !this.isVisible;
  }

  copyAndCreateSheet(): void {}

}
