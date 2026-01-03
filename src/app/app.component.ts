import { AfterViewInit, Component, Inject, Injector, OnInit, ViewChild } from '@angular/core';
import { GoogleSheetsService } from './services/googleSheetService.service';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationComponent } from './components/Notification/notification.component';
import { NotificationService } from './services/notification.service';
import { NotificationStyle, NotificationType } from '@assets/Entities/enum';
import { SpinnerService } from './services/spinner.service';
import { SpinnerComponent } from './components/Spinner/spinner.component';
import { ConfigService } from './services/config.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit {

  constructor(@Inject(Injector) private injector: Injector, private router: Router, private route: ActivatedRoute, private googleSheet: GoogleSheetsService) { }

  get sheetsService(): GoogleSheetsService { return this.injector.get(GoogleSheetsService); }
  get configService(): ConfigService { return this.injector.get(ConfigService); }
  get notificationService(): NotificationService { return this.injector.get(NotificationService); }
  get SpinnerService(): SpinnerService { return this.injector.get(SpinnerService); }

  @ViewChild(NotificationComponent) private notificationComponent!: NotificationComponent;
  @ViewChild(SpinnerComponent) private spinnerComponent!: SpinnerComponent;

  ngOnInit(): void {
    const token = new URL(window.location.href).searchParams.get('code');
    if (token) {
      this.sheetsService.handleAuthCallback(token).subscribe({
        next: (response: any) => {
          this.sheetsService.storeToken(response);
          this.notificationService.open(NotificationStyle.TOAST, 'Authentication successful! You can now connect your Google Sheet.', NotificationType.SUCCESS, 4000);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.notificationService.open(NotificationStyle.POPUP, error.message, NotificationType.ERROR);
        }
      });
    } 
    // else {
    //   this.router.navigate(['/dashboard']);
    // }
  }

  ngAfterViewInit(): void {
    this.notificationService.register(this.notificationComponent);
    this.SpinnerService.register(this.spinnerComponent);
  }
}