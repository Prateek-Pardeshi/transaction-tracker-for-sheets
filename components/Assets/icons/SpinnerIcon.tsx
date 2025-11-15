import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner-icon',
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      class="animate-spin"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 2v2m0 16v2m8.4-14.4l-1.4 1.4M5 19l-1.4 1.4M22 12h-2M4 12H2m15.4-8.4l1.4-1.4M5 5l1.4-1.4"
      />
    </svg>
  `,
  styles: [':host { display: contents; }']
})
export class SpinnerIconComponent {}
