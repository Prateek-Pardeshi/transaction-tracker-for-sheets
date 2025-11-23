declare const gapi: any;
declare const google: any;

import { Inject, Injectable, Injector, OnInit } from '@angular/core';
import { Transaction, SheetDetails } from '@assets/Entities/types';
import { NotificationStyle, NotificationType, TransactionType } from '@assets/Entities/enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, forkJoin, from, Observable, switchMap, timer, Subject, empty, of } from 'rxjs';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleSheetsService implements OnInit {

  constructor(@Inject(Injector) private injector: Injector, private http: HttpClient) {
    this.startTokenWatcher();
  }

  get notification(): NotificationService { return this.injector.get(NotificationService); }

  private client_secret = environment.googleClientSecret;
  private clientId = environment.googleClientId;
  private apiKey = environment.googleApiKey;
  private scope = 'https://www.googleapis.com/auth/spreadsheets';
  private tokenClient: any;
  private tokenDrive: any;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private tokenExpiryTime: number | null = null;
  public transactionsSubject = new Subject<any>();

  accessToken: string | null = null;
  transactions$: Observable<Transaction[]>;

  sheetDetails: SheetDetails = {
    sheetURL: '',
    sheetId: '',
    sheetName: ''
  };

  ngOnInit() {
    this.transactions$ = this.transactionsSubject.asObservable();
  }

  //#region Sign In & Token Cration

  signIn() {
    localStorage.removeItem('token');
    localStorage.removeItem('transactions');
    localStorage.removeItem('sheetURL');
    this.initGapi$().pipe(
      switchMap(() => this.initAuthClient$()),
      switchMap(() => this.requestAccessToken$())
    ).subscribe({
      next: (res) => { },
      error: (err) => {
        this.notification.open(NotificationStyle.POPUP, err?.message, NotificationType.ERROR);
      },
    });
  }

  signOut() {
    gapi && gapi.auth2 && gapi.auth2.getAuthInstance().signOut();
  }

  initGapi$(): Observable<void> {
    return new Observable<void>((observer) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: environment.googleApiKey,
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

        // this.tokenDrive = google.accounts.oauth2.initTokenClient({
        //   client_id: this.clientId,
        //   scope: 'https://www.googleapis.com/auth/drive.file',
        //   callback: async (tokenResponse) => {
        //     if (!tokenResponse.access_token) {
        //       console.error('Failed to get access token');
        //       return;
        //     }

        //     console.log('OAuth Token:', tokenResponse.access_token);

        //     // 2. Set token for gapi.client
        //     gapi.client.setToken({ access_token: tokenResponse.access_token });
        //   }
        // })

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
      this.tokenClient.requestCode();
    });
  }

  //#endregion

  //#region Vaidate Token & Token Storage

  getValidAccessToken$(): Observable<string> {
    // Token valid for 1 hour (3600s)
    const now = Date.now();
    if (this.accessToken && this.tokenExpiryTime && now < this.tokenExpiryTime - 30_000) {
      return from(Promise.resolve(this.accessToken));
    }
    // else request new one
    return this.requestAccessToken$();
  }

  storeToken(tokenResponse: any) {
    this.accessToken = tokenResponse.access_token;
    this.setAccessTokenFromStorage();
    this.tokenExpiryTime = tokenResponse.refresh_token_expires_in;
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

  validateToken(): Observable<any> {
    return this.http.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${this.accessToken}`)
  }

  //#endregion 


  //#region Google Sheet Actions

  addTransaction(values: Transaction): Observable<any> {
    if (!this.sheetDetails.sheetId || !this.sheetDetails.sheetName || !this.sheetDetails.sheetURL) {
      this.notification.open(NotificationStyle.TOAST, 'Checking Google Sheet Connection...', NotificationType.INFO);
      this.handleSheetConnection();
      return of(null);
    }
    if (!this.accessToken) {
      this.notification.open(NotificationStyle.TOAST, 'Requesting access token...', NotificationType.INFO);
      this.getValidAccessToken$()
    }
    return this.validateToken().pipe(
      switchMap((response) => {
        let token = response
        const range = values.type === TransactionType.INCOME ? `${this.sheetDetails.sheetName}!G:J` : `${this.sheetDetails.sheetName}!B:E`;
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
        return this.http.post(url, valueRangeBody, { headers });
      }),
      catchError((error) => {
        this.notification.open(NotificationStyle.POPUP, "Token Invlid! Try logging in again", NotificationType.ERROR);
        this.signIn();
        return of(null);
      })
    )
  }

  handleSheetConnection() {
    this.sheetDetails.sheetURL = localStorage.getItem('sheetURL') || '';
    if (!this.sheetDetails.sheetURL.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit(\?.*)?(#.*)?$/)) {
      this.notification.open(NotificationStyle.POPUP, 'No sheet selected, please connect a google sheet first!', NotificationType.ERROR);
      return;
    }
    this.sheetDetails.sheetId = this.getSheetIdFromURL(this.sheetDetails.sheetURL);
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
      let sheetData = temptData.sort((a, b) =>
        this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime()
      );
      this.transactionsSubject.next(sheetData)
      localStorage.setItem('transactions', JSON.stringify(sheetData));
    });
  }

  copySheetFromUrl(sheetUrl: string, newName: string): Observable<void> {
    return new Observable<void>((observer) => {
      try {
        const sourceId = this.getSheetIdFromURL(sheetUrl);
        if (!sourceId) {
          throw new Error('Invalid Google Sheet URL');
        }
        // gapi.load('client', async () => {
        //   await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
        //   await gapi.client.drive.files.copy({
        //     fileId: sourceId,
        //     resource: { name: newName }
        //   });
        //   observer.next();
        //   observer.complete();
        // });
        // gapi.load('client:auth2', async () => {

        //   // 1. Initialize
        //   await gapi.client.init({
        //     apiKey: environment.googleApiKey,
        //     clientId: environment.googleClientId,
        //     discoveryDocs: [
        //       'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
        //     ],
        //     scope: 'https://www.googleapis.com/auth/drive.file'
        //   });

        //   // 2. Sign in (must wait for it)
        //   const GoogleAuth = gapi.auth2.getAuthInstance();
        //   await GoogleAuth.signIn();

        //   // 3. Ensure token exists
        //   const user = GoogleAuth.currentUser.get();
        //   const token = user.getAuthResponse().access_token;

        //   if (!token) {
        //     console.error("User not authenticated");
        //     return;
        //   }

        //   console.log("OAuth Token:", token);  // <-- SHOULD NOT BE EMPTY

        //   // 4. Copy Google Sheet
        //   const response = await gapi.client.drive.files.copy({
        //     fileId: sourceId,
        //     resource: { name: newName }
        //   });

        //   console.log("Copied File ID:", response.result.id);
        // });

        if (!this.tokenDrive) {
          this.initAuthClient$().subscribe({
            next: (res) => {
              console.log('res', res);
              const response = gapi.client.drive.files.copy({
              fileId: sourceId,
              resource: { name: newName }
            });
            console.log('Copied File ID:', response.result.id);
            },
            error: (error) => {
              console.log('error', error)
            }
          })
        } else {
          const response = gapi.client.drive.files.copy({
              fileId: sourceId,
              resource: { name: newName }
            });
            console.log('Copied File ID:', response.result.id);
        }

      } catch (error) {
        this.notification.open(NotificationStyle.POPUP, error, NotificationType.ERROR);
      }
    });
  }

  //#endregion

  //#region Misc Functions

  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  getSheetIdFromURL(url: string) {
    let sheetIdMatch = url.match(/spreadsheets\/d\/([^\/]+)\/edit/);
    return sheetIdMatch ? sheetIdMatch[1] : '';
  }
  //#endregion
}
