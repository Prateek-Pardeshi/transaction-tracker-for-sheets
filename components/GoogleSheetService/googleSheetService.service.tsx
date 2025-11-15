declare const gapi: any;
declare const google: any;

import { Inject, Injectable, Injector } from '@angular/core';
import { Transaction, SheetDetails } from '../Assets/Entities/types';
import { NotificationStyle, NotificationType, TransactionType } from '../Assets/Entities/enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, forkJoin, from, Observable, switchMap, timer } from 'rxjs';
import { NotificationService } from '../Notification/notification.service';
import { environment } from './src/environment/environment';

@Injectable({ providedIn: 'root' })
export class GoogleSheetsService {

  constructor(@Inject(Injector) private injector: Injector, private http: HttpClient) {
    this.startTokenWatcher();
  }

  get notification(): NotificationService { return this.injector.get(NotificationService); }

  private apiKey = environment.API_KEY;
  private client_secret = environment.CLIENT_SECRET;
  private clientId = environment.CLIENT_ID;
  private scope = 'https://www.googleapis.com/auth/spreadsheets';
  private gapiLoaded = false;
  private tokenClient: any;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private tokenExpiryTime: number | null = null;

  accessToken: string | null = null;

  sheetDetails: SheetDetails = {
    sheetURL: '',
    sheetId: '',
    sheetName: '',
    sheetData: []
  };

  initGapi$(): Observable<void> {
    return new Observable<void>((observer) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          observer.next();
          observer.complete();
        } catch (err) {
          this.notification.open(NotificationStyle.POPUP, err.message, NotificationType.ERROR);
        }
      });
    });
  }

  initAuthClient$(): Observable<void> {
    return new Observable<void>((observer) => {
      try {
        this.tokenClient = google.accounts.oauth2.initCodeClient({
          client_id: this.clientId,
          ux_mode: 'redirect', //'popup'
          redirect_uri: window.location.origin + '/auth/callback',
          scope: this.scope,
          callback: (tokenResponse: any) => {
            this.storeToken(tokenResponse);
            observer.next();
            observer.complete();
          },
        });
        
        observer.next();
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  requestAccessToken$(): Observable<string> {
    return new Observable<string>((observer) => {
      this.tokenClient.callback = (tokenResponse: any) => {
        this.storeToken(tokenResponse);
        observer.next(this.accessToken!);
        observer.complete();
      };
      // this.tokenClient.requestAccessToken({ prompt: 'consent' });
      this.tokenClient.requestCode();
    });
  }


  getValidAccessToken$(): Observable<string> {
    // Token valid for 1 hour (3600s)
    const now = Date.now();
    if (this.accessToken && this.tokenExpiryTime && now < this.tokenExpiryTime - 30_000) {
      return from(Promise.resolve(this.accessToken));
    }
    // else request new one
    return this.requestAccessToken$();
  }

  private storeToken(tokenResponse: any) {
    this.accessToken = tokenResponse.access_token;
    this.setAccessTokenFromStorage()
    localStorage.setItem('token', atob(this.accessToken));
    // Set expiry ~1 hour later (3600s typical)
    this.tokenExpiryTime = Date.now() + 3_600_000;
    this.tokenSubject.next(this.accessToken);
  }

  private startTokenWatcher() {
    timer(0, 60_000) // every minute
      .pipe(
        filter(() => !!this.tokenExpiryTime),
        filter(() => Date.now() > (this.tokenExpiryTime! - 30_000)), // 30s before expiry
        switchMap(() => this.requestAccessToken$()),
        catchError((err) => {
          this.notification.open(NotificationStyle.POPUP, err?.message, NotificationType.ERROR);
          return [];
        })
      )
      .subscribe((token) => {
        console.log('🔄 Token auto-refreshed');
      });
  }

  setAccessTokenFromStorage() {
    this.accessToken != null && this.accessToken && localStorage.setItem('token', this.accessToken);
  }

  handleAuthCallback(code: string): Observable<Object> {
    const body = new URLSearchParams({
      code: code,
      client_id: this.clientId,
      client_secret: this.client_secret,
      redirect_uri: window.location.origin + '/auth/callback',
      grant_type: 'authorization_code'
    });

    return this.http.post('https://oauth2.googleapis.com/token', body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });
  }
  // async initClient() {
  //   await new Promise<void>((resolve) => {
  //     gapi.load('client', async () => {
  //       await gapi.client.init({
  //         discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  //       });
  //       resolve();
  //     });
  //   });

  //   this.tokenClient = google.accounts.oauth2.initTokenClient({
  //     client_id: this.clientId,
  //     ux_mode: 'popup',
  //     scope: this.scope,
  //     callback: (tokenResponse: any) => {
  //       this.accessToken = tokenResponse.access_token;
  //     },
  //   });
  // }

  // async requestAccessToken(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     this.tokenClient.callback = (resp: any) => {
  //       if (resp.error) {
  //         reject(resp);
  //         return;
  //       }
  //       this.accessToken = resp.access_token;
  //       resolve();
  //     };

  //     this.tokenClient.requestAccessToken({ prompt: 'consent' });
  //   });
  // }

  signIn() {
    this.initGapi$().pipe(
      switchMap(() => this.initAuthClient$()),
      switchMap(() => this.requestAccessToken$())
    ).subscribe({
      next: (res) => {
        // this.notification.open(NotificationStyle.TOAST, 'Welcome ' + res, NotificationType.SUCCESS);
      },
      error: (err) => {
        this.notification.open(NotificationStyle.POPUP, err?.message, NotificationType.ERROR);
      },
    });
    // this.initGapi$().subscribe((res) => {
    //   this.initAuthClient$().subscribe((res1) => {
    //     res1; res;
    //   });
    // })
  }

  signOut() {
    gapi.auth2.getAuthInstance().signOut();
  }

  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  addTransaction(values: Transaction): Observable<any> {
    if (!this.sheetDetails.sheetId || !this.sheetDetails.sheetName || !this.sheetDetails.sheetURL) {
      this.notification.open(NotificationStyle.TOAST, 'Checking Google Sheet Connection...', NotificationType.INFO);
      this.handleSheetConnection();
    }
    if (!this.accessToken) {
      this.notification.open(NotificationStyle.TOAST, 'Requesting access token...', NotificationType.INFO);
      this.getValidAccessToken$()
    }
    // gapi.client.setToken({ access_token: this.accessToken });
    const range = values.type === TransactionType.INCOME ? `${this.sheetDetails.sheetName}!G:J` : `${this.sheetDetails.sheetName}!B:E`;
    // const params = {
    //   spreadsheetId: this.sheetDetails.sheetId,
    //   range: range,
    //   valueInputOption: 'USER_ENTERED',
    // };

    const valueRangeBody = {
      values: [
        [this.formatDate(values.date), values.amount, values.description, values.category]
      ],
    };

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetDetails.sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    // return gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
    return this.http.post(url, valueRangeBody, { headers });
  }

  handleSheetConnection() {
    this.sheetDetails.sheetURL = localStorage.getItem('sheetURL') || '';
    if (!this.sheetDetails.sheetURL) {
      this.notification.open(NotificationStyle.POPUP, 'No sheet selected, please connect a google sheet first!', NotificationType.ERROR);
      return;
    }
    let sheetIdMatch = this.sheetDetails.sheetURL.match(/spreadsheets\/d\/([^\/]+)\/edit/);
    this.sheetDetails.sheetId = sheetIdMatch ? sheetIdMatch[1] : '';
    this.sheetDetails.sheetName = 'Transactions';
  }

  fetchTransactions(type: TransactionType = TransactionType.EXPENSE) {
    if (!this.sheetDetails.sheetId || !this.sheetDetails.sheetName) return;
    const incomeQuery = encodeURIComponent('select G, H, I, J where G is not null and H is not null and I is not null and J is not null');
    const expenseQuery = encodeURIComponent('select B, C, D, E where B is not null and C is not null and D is not null and E is not null');
    const url = `https://docs.google.com/spreadsheets/d/${this.sheetDetails.sheetId}/gviz/tq?sheet=${this.sheetDetails.sheetName}&tq=`;
    const incomeData$ = this.http.get(url + incomeQuery, { responseType: 'text' });
    const expenseData$ = this.http.get(url + expenseQuery, { responseType: 'text' });

    forkJoin([incomeData$, expenseData$]).subscribe(([incomeRes, expenseRes]) => {
      const incomeJson = JSON.parse(incomeRes.substring(47).slice(0, -2));
      const expenseJson = JSON.parse(expenseRes.substring(47).slice(0, -2));

      let idata = incomeJson.table.rows.map((r: any, index) => ({
        id: index + 1,
        date: r.c[0]?.f,
        amount: r.c[1]?.v,
        description: r.c[2]?.v,
        category: r.c[3]?.v,
        type: TransactionType.INCOME
      }));
      let edata = expenseJson.table.rows.map((r: any, index) => ({
        id: index + 1,
        date: r.c[0]?.f,
        amount: r.c[1]?.v,
        description: r.c[2]?.v,
        category: r.c[3]?.v,
        type: TransactionType.EXPENSE
      }));

      let temptData = [...idata, ...edata];
      this.sheetDetails.sheetData = temptData.sort((a, b) =>
        this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime()
      );

      localStorage.setItem('transactions', JSON.stringify(this.sheetDetails.sheetData));
    });
  }
}
