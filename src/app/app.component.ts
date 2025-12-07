import { AfterViewInit, Component, Inject, Injector, OnInit, ViewChild } from '@angular/core';
import { GoogleSheetsService } from './services/googleSheetService.service';
import { Router } from '@angular/router';

import { NotificationComponent } from './components/Notification/notification.component';
import { NotificationService } from './services/notification.service';
import { SpinnerService } from './services/spinner.service';
import { SpinnerComponent } from './components/Spinner/spinner.component';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit {

  constructor(@Inject(Injector) private injector: Injector, private router: Router, private googleSheet: GoogleSheetsService) { }

  get sheetsService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService); }
  get notificationService(): NotificationService { return this.injector.get(NotificationService); }
  get SpinnerService(): SpinnerService { return this.injector.get(SpinnerService); }

  @ViewChild(NotificationComponent) private notificationComponent!: NotificationComponent;
  @ViewChild(SpinnerComponent) private spinnerComponent!: SpinnerComponent;

  ngOnInit(): void {
    // let isLoggedIn = localStorage.getItem('token') || null;
    
    // // this.router.navigate(['/access-denied']);
    // if (!isLoggedIn) {
    //   this.sheetsService.signIn();
    // } else {
      this.router.navigate(['/dashboard']);
    // }
  }

  ngAfterViewInit(): void {
    this.notificationService.register(this.notificationComponent);
    this.SpinnerService.register(this.spinnerComponent);
  }
}