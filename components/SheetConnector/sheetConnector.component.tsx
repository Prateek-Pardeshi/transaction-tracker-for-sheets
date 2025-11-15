import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sheet-connector',
  templateUrl: './sheetConnector.component.html',
})
export class SheetConnectorComponent {

  constructor() {}

  @Input() isConnected: boolean = false;
  @Input() sheetUrl: string = '';
  @Input() isConnecting: boolean = false;
  @Output() connect = new EventEmitter<string>();

  public isVisible: boolean = false;
  public url: string = '';


  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

  async handleConnect() {
    if (!this.url || this.isConnecting) return;
    this.connect.emit(this.url);
  }

  handleReset() {
    this.url = '';
    localStorage.removeItem('sheetURL');
    localStorage.removeItem('transactions');
    window.location.reload();
  }
}