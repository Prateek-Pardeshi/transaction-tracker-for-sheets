import { Injectable } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { TransactionConstants } from '@assets/Entities/enum';
import { Observable, Subject } from 'rxjs';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})

export class FirebaseDataService {
    constructor(private firestore: Firestore) { }

    transactionsSubject = new Subject<any>();
    transactions$: Observable<Transaction[]>;

    ngOnInit() {
        this.transactions$ = this.transactionsSubject.asObservable();
    }

    addTransaction(transaction: Transaction): Promise<any> {
        const transactionCollection = collection(this.firestore, TransactionConstants.COLLECTION_NAME);
        return addDoc(transactionCollection, transaction);
    }

    getTransactions() {
        const usersRef = collection(this.firestore, TransactionConstants.COLLECTION_NAME);
        return collectionData(usersRef, { idField: 'id' });
    }

    checkAndAddRecurringTransactions(allTrans: Transaction[], recTrans: Transaction[], values: Transaction): Transaction[] {
        const currentDate = new Date().getDate();
        const currentMonth = new Date().getMonth() + 1;
        allTrans.push(values);
        let currentMonthTranx = allTrans.filter(t => {
            const [day, month, year] = (t.date || '').split('/').map(Number);
            const txDate = new Date(year, month - 1, day);
            return txDate.getMonth() + 1 === currentMonth;
        });
        let netTrans: Transaction[] = [...recTrans];
        for (let i = 0; i < recTrans.length; i++) { 
            for (let j = 0; j < currentMonthTranx.length; j++) { 
                if (currentMonthTranx[j].category === recTrans[i].category && currentMonthTranx[j].type === values.type) { 
                    const idx = netTrans.indexOf(recTrans[i]);
                    idx > -1 && netTrans.splice(idx, 1);
                    break; 
                }
            } 
        }
        netTrans.push(values);
        return netTrans;
    }
}