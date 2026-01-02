import { Injectable } from '@angular/core';
import { SpinnerComponent } from '../components/Spinner/spinner.component';

@Injectable({ providedIn: 'root' })

export class SpinnerService {
    constructor() {}
    private spinnerComponent: SpinnerComponent | null = null;

    register(spinner: SpinnerComponent) {
        this.spinnerComponent = spinner;
    }

    startSpinner(loader: boolean = true): void {
        if (this.spinnerComponent) {
            this.spinnerComponent.startSpinner(loader);
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