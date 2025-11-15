import { Injectable } from '@angular/core';
import { SpinnerComponent } from './spinner.component';

@Injectable({ providedIn: 'root' })

export class SpinnerService {
    constructor() {}
    private spinnerComponent: SpinnerComponent | null = null;

    register(spinner: SpinnerComponent) {
        this.spinnerComponent = spinner;
    }

    startSpinner(): void {
        if (this.spinnerComponent) {
            this.spinnerComponent.startSpinner();
        } else {
            console.warn('SpinnerComponent is not set.');
        }
    }

    stopSpinner(): void {
        if (this.spinnerComponent) {
            this.spinnerComponent.stopSpinner();
        } else {
            console.warn('SpinnerComponent is not set.');
        }
    }
}