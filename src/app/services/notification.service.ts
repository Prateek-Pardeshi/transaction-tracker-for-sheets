import { Injectable } from '@angular/core';
import { NotificationComponent } from '../components/Notification/notification.component';

@Injectable({ providedIn: 'root' })

export class NotificationService {
    constructor() {}
    private notificationComponent: NotificationComponent | null = null;

    register(notification: NotificationComponent) {
        this.notificationComponent = notification;
    }

    open(notificationStyle, message: string, type, duration: number = 3000): void {
        if (this.notificationComponent) {
            this.notificationComponent.showNotification(notificationStyle, message, type, duration);
        } else {
            console.warn('NotificationComponent is not set.');
        }
    }

    close(): void {
        if (this.notificationComponent) {
            this.notificationComponent.closeNotification();
        } else {
            console.warn('NotificationComponent is not set.');
        }
    }
}