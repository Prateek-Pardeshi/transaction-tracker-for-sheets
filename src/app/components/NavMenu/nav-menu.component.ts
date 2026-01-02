import { Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleSheetsService } from '@services/googleSheetService.service';

@Component({
  selector: 'app-nav-menu',
  standalone: false,
  styleUrl: './nav-menu.scss',
  templateUrl: './nav-menu.component.html'
})
export class NavMenuComponent {
  constructor(private router: Router, private inject: Injector) { }

  get sheetService(): GoogleSheetsService { return this.inject.get(GoogleSheetsService); }

  svgAction(action: string): void {
    const navMenu = document.getElementById("menu") as HTMLInputElement;
    if(navMenu) navMenu.checked = false;
    switch (action) {
      case 'top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'bottom':
        window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
        break;
      case 'login':
        this.sheetService.signIn();
        break;
      case 'home':
        this.router.navigate(['/dashboard']);
        break;
      case 'addRecord':
        this.router.navigate(['/addRecord']);
        break;
    }
  }
}
