import { Component, ViewContainerRef, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { NotificationStyle } from '@assets/Entities/enum';

@Component({
    selector: 'app-notification',
    standalone: false,
    styleUrls: ['./notification.scss'],
    templateUrl: './notification.component.html'
})

export class NotificationComponent {
    @ViewChild('notificationContainer', { static: true, read: ViewContainerRef })
    notificationContainerRef!: ViewContainerRef;

    @ViewChild('notificationToast', { static: true })
    notificationToastTemplateRef!: TemplateRef<any>;

    @ViewChild('notificationPopUp', { static: true })
    notificationPopUpTemplateRef!: TemplateRef<any>;

    @ViewChild('toastDiv', { static: false })
    toastDivRef!: ElementRef;

    @ViewChild('popUpDiv', { static: false })
    popUpDivRef!: ElementRef;

    constructor() { }

    async showNotification(notificationStyle, message, type, duration: number = 3000): Promise<void> {
        if (this.notificationContainerRef) {
            this.notificationContainerRef.clear();

            if (notificationStyle === NotificationStyle.TOAST) {
                this.notificationContainerRef.createEmbeddedView(this.notificationToastTemplateRef, {
                    message: message,
                    type: type
                });

                this.closeNotification(duration).then(() => {
                    this.notificationContainerRef.clear();
                });
            } else {
                this.notificationContainerRef.createEmbeddedView(this.notificationPopUpTemplateRef, {
                    message: message,
                    type: type
                });
            }

        }
    }

    closeNotification(delay: number = 1000): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.toastDivRef && this.toastDivRef.nativeElement.classList.add('animate-slide-out');
                resolve();
            }, delay)
        });
    }

    closePopUpNotification(): void {
        if (this.popUpDivRef) {
            this.popUpDivRef.nativeElement.classList.remove('pop-in');
            this.popUpDivRef.nativeElement.classList.add('pop-out');
        }
        setTimeout(() => {
            this.notificationContainerRef && this.notificationContainerRef.clear();
        }, 300);
    }
}