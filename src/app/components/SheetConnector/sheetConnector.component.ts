import { Component, EventEmitter, Input, Output } from '@angular/core';
import { icons } from '@assets/icons/icons';
import { SheetURL } from '@assets/Entities/enum';

@Component({
  selector: 'app-sheet-connector',
  standalone: false,
  templateUrl: './sheetConnector.component.html',
})
export class SheetConnectorComponent {

  constructor() { }

  @Input() isConnected: boolean = false;
  @Input() sheetUrl: string = '';
  @Input() isConnecting: boolean = false;
  @Output() connect = new EventEmitter<any>();
  @Output() create = new EventEmitter<any>();

  public isVisible: boolean = false;
  public url: string = SheetURL.DEFAULT_SHEET_URL;
  public icons = icons;
  public copySheetURL = SheetURL.COPY_SHEET_URL;
  public isCopyingDone: boolean = false;
  public name: string = (new Date().getFullYear() + 1).toString();

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

  async handleConnect() {
    if (!this.url || this.isConnecting) return;
    this.connect.emit(this.url);
  }

  handleReset() {
    this.url = '';
    window.location.reload();
  }
}