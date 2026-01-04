declare const gapi: any;
declare const google: any;

import { Inject, Injectable, Injector, OnInit, inject } from '@angular/core';
import { Transaction, SheetDetails } from '@assets/Entities/types';
import { NotificationStyle, NotificationType, TransactionType, TransactionConstants } from '@assets/Entities/enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, forkJoin, from, Observable, switchMap, timer, Subject, of, Subscription } from 'rxjs';
import { Auth, GoogleAuthProvider, signInWithPopup, user, User } from '@angular/fire/auth';
import { NotificationService } from './notification.service';
import { FirebaseDataService } from './firebaseData.service';
import { environment } from '../../environments/environment';
import { SheetURL } from '@assets/Entities/enum';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class GoogleSheetsService implements OnInit {

  constructor(@Inject(Injector) private injector: Injector, private http: HttpClient) {
    // this.user$.subscribe(async (currentUser) => {
    //   if (currentUser) {
    //     const token = await currentUser.getIdToken();
    //     console.log('Logged in silently! Token:', token);
    //   } else {
    //     console.log('Not logged in');
    //   }
    // });

    this.dataService.getTransactions(TransactionConstants.COLLECTION_RECURRING_TRANSACTION).subscribe((data: Transaction[]) => {
      this.recuringTransactions = data;
    });
  }

  get notification(): NotificationService { return this.injector.get(NotificationService); }
  get dataService(): FirebaseDataService { return this.injector.get(FirebaseDataService); }
  get configService(): ConfigService { return this.injector.get(ConfigService); }

  private client_secret = environment.googleClientSecret;
  private clientId = environment.googleClientId;
  private apiKey = environment.googleApiKey;
  private scope = this.configService.config.SCOPE;
  private tokenClient: any;
  private tokenDrive: any;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private tokenExpiryTime: number | null = null;
  private recuringTransactions: Transaction[] = [];
  public transactionsSubject = new Subject<any>();
  // private auth: Auth = inject(Auth);

  // user$: Observable<User | null> = user(this.auth);
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

  async signIn() {
    localStorage.removeItem(TransactionConstants.STORAGE_TOKEN);
    const provider = new GoogleAuthProvider();
    // try {
    //   await signInWithPopup(this.auth, provider);
    //   // No need to manually redirect; the user$ stream will update automatically
    // } catch (error) {
    //   console.error('Login failed', error);
    // }
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

  async getToken(): Promise<string | null> {
    // const currentUser = this.auth.currentUser;
    // if (currentUser) {
    //   // forceRefresh = false (default) means it uses the cached token if valid
    //   // It handles the refresh silently if expired
    //   return await currentUser.getIdToken(false);
    // }
    return null;
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
            discoveryDocs: [this.configService.config.DISCOVERY_DOC],
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

        google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => this.handleIdToken(response),
          auto_select: true,
          cancel_on_tap_outside: false
        });

        this.tokenClient = google.accounts.oauth2.initCodeClient({
          client_id: this.clientId,
          ux_mode: 'redirect', //'popup'
          redirect_uri: window.location.origin + '/auth/callback',
          scope: this.configService.config.TOKEN_SCOPE,
          callback: (tokenResponse: any) => {
            this.storeToken(tokenResponse);
            observer.next();
            observer.complete();
          },
          auto_select: true
        });
        observer.next();
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  handleIdToken(response: any) {
    this.notification.open(NotificationStyle.TOAST, 'Welcome: ' + response.credential, NotificationType.SUCCESS);
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
    this.accessToken != null && this.accessToken && localStorage.setItem(TransactionConstants.STORAGE_TOKEN, this.accessToken);
  }

  handleAuthCallback(code: string): Observable<Object> {
    const body = new URLSearchParams({
      code: code,
      client_id: this.clientId,
      client_secret: this.client_secret,
      redirect_uri: window.location.origin + '/auth/callback',
      grant_type: 'authorization_code'
    });

    return this.http.post(this.configService.config.TOKEN_URL, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });
  }

  validateToken(): Observable<any> {
    return this.http.get(this.configService.config.VALIDATE_TOKEN_URL.replace('_TOKEN_', this.accessToken));
  }

  //#endregion 


  //#region Google Sheet Actions

  addTransaction(values: Transaction, allTransactions: Transaction[]): Observable<any> {
    if (!this.sheetDetails.sheetId || !this.sheetDetails.sheetName || !this.sheetDetails.sheetURL) {
      this.notification.open(NotificationStyle.TOAST, 'Checking Google Sheet Connection...', NotificationType.INFO);
      this.handleSheetConnection();
      return of(null);
    }
    if (!this.accessToken) {
      this.notification.open(NotificationStyle.TOAST, 'Requesting access token...', NotificationType.INFO);
      this.signIn()
    }
    return this.validateToken().pipe(
      switchMap((response) => {
        let token = response;
        values.date = this.formatDate(values.date);
        const val = this.dataService.checkAndAddRecurringTransactions(allTransactions, this.recuringTransactions, values);
        const range = values.type === TransactionType.INCOME ? `${this.sheetDetails.sheetName}!G:J` : `${this.sheetDetails.sheetName}!B:E`;
        const valueRangeBody = {
          values: val.map((v) => [this.formatDate(v.date), v.amount, v.description, v.category]),
        };

        const url = this.configService.config.ADD_TRANSACTION_URL.replace("_SPREADSHEET_ID_", this.sheetDetails.sheetId).replace("_RANGE_", range);

        const headers = {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        };
        return this.http.post(url, valueRangeBody, { headers });
      }),
      catchError((error) => {
        this.notification.open(NotificationStyle.POPUP, error.message, NotificationType.ERROR);
        this.signIn();
        return of(null);
      })
    )
  }

  handleSheetConnection() {
    this.sheetDetails.sheetURL = this.configService.config.DEFAULT_SHEET_URL;
    if (!this.sheetDetails.sheetURL.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit(\?.*)?(#.*)?$/)) {
      this.notification.open(NotificationStyle.POPUP, 'No sheet selected, please connect a google sheet first!', NotificationType.ERROR);
      return;
    }
    this.sheetDetails.sheetId = this.getSheetIdFromURL(this.sheetDetails.sheetURL);
    this.sheetDetails.sheetName = 'Transactions';
  }

  fetchTransactions(): Observable<any> {
    if (!this.sheetDetails.sheetId || !this.sheetDetails.sheetName) return;
    const incomeQuery = encodeURIComponent(this.configService.config.INCOME_QUERY);
    const expenseQuery = encodeURIComponent(this.configService.config.EXPENSE_QUERY);
    const url = this.configService.config.FETCH_TRANSACTION_URL.replace("_SPREADSHEET_ID_", this.sheetDetails.sheetId).replace("_SHEET_NAME_", this.sheetDetails.sheetName);
    const incomeData$ = this.http.get(url + incomeQuery, { responseType: 'text' });
    const expenseData$ = this.http.get(url + expenseQuery, { responseType: 'text' });

    return forkJoin([incomeData$, expenseData$])
  }

  copySheetFromUrl(sheetUrl: string, newName: string): Observable<any> {
    if (!this.accessToken) {
      this.notification.open(NotificationStyle.TOAST, 'Requesting access token...', NotificationType.INFO);
      this.signIn()
    }
    return this.validateToken().pipe(
      switchMap(() => {
        const sourceId = this.getSheetIdFromURL(sheetUrl);
        if (!sourceId) {
          throw new Error('Invalid Google Sheet URL');
        }
        const url = `https://www.googleapis.com/drive/v3/files/${sourceId}/copy`;

        const headers = new HttpHeaders({
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        });

        const body = { name: newName };

        return this.http.post(url, body, { headers });
      }),
      catchError((error) => {
        this.notification.open(NotificationStyle.POPUP, error.message, NotificationType.ERROR);
        //this.signIn();
        return of(null);
      })
    )
  }

  //#endregion

  //#region Misc Functions

  parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  formatDate(isoDate: string): string {
    if (isoDate.includes('/')) return isoDate;
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  sortTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.sort((a, b) =>
      this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime()
    );
  }

  getSheetIdFromURL(url: string) {
    let sheetIdMatch = url.match(/spreadsheets\/d\/([^\/]+)\/edit/);
    return sheetIdMatch ? sheetIdMatch[1] : '';
  }
  //#endregion
}
