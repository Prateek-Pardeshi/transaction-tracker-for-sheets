import { Inject, Injectable, Injector } from '@angular/core';
import { FirebaseDataService } from '@services/firebaseData.service';
import { TransactionConstants } from '@assets/Entities/enum';
import { TransactionMetadata } from '@assets/Entities/types';
import { firstValueFrom, of } from 'rxjs';
@Injectable({ providedIn: 'root' })

export class ConfigService {
  config = new TransactionMetadata();
  firstLoad: boolean = false;

  constructor(@Inject(Injector) private injector: Injector) { }

  get firebaseService(): FirebaseDataService { return this.injector.get(FirebaseDataService) }

  loadMetadata(): Promise<void> {
    if(this.firstLoad) return new Promise(null);
    return firstValueFrom(this.firebaseService.getTransactions(TransactionConstants.COLLECTION_TRANSACTION_METADATA))
      .then(data => {
        if (data && data.length > 0) {
          this.config.DEFAULT_SHEET_URL = data[0].default_sheet_url,
          this.config.COPY_SHEET_URL = data[0].copy_sheet_url,
          this.config.SCOPE = data[0].scope;
          this.config.TOKEN_SCOPE = data[0].token_scope;
          this.config.DISCOVERY_DOC = data[0].discovery_doc;
          this.config.VALIDATE_TOKEN_URL = data[0].validate_token_url;
          this.config.TOKEN_URL = data[0].token_url;
          this.config.ADD_TRANSACTION_URL = data[0].add_transaction_url;
          this.config.FETCH_TRANSACTION_URL = data[0].fetch_transaction_url;
          this.config.INCOME_QUERY = data[0].income_query;
          this.config.EXPENSE_QUERY = data[0].expense_query;
          this.config.EXPENSE_CATEGORIES = data[0].expense_categories;
          this.config.INCOME_CATEGORIES = data[0].income_categories;
          this.config.MONTH = data[0].month;
          this.config.DOCUMENT_ID = data[0].document_id
          this.firstLoad = true;
        }
      });
  }
}