import { Component, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: false,
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css'
})
export class SpinnerComponent {
  @ViewChild('spinnerContainer', { static: true, read: ViewContainerRef })
  spinnerContainerRef!: ViewContainerRef;

  @ViewChild('spinnerTemplate', { static: true })
  spinnerTemplateRef!: TemplateRef<any>;

  constructor() { }

  atomicLoader: boolean = true;

  startSpinner(loader: boolean = true): void {
    this.atomicLoader = loader;
    if (this.spinnerContainerRef) {
      this.spinnerContainerRef.clear();
      this.spinnerContainerRef.createEmbeddedView(this.spinnerTemplateRef);
    }
  }

  stopSpinner(): void {
    this.spinnerContainerRef && this.spinnerContainerRef.clear();
  }
}
