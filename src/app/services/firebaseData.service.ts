import { Injectable } from '@angular/core';
import { Transaction } from '@assets/Entities/types';
import { TransactionConstants } from '@assets/Entities/enum';
import { Observable, Subject } from 'rxjs';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc } from '@angular/fire/firestore';

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
        const transactionCollection = collection(this.firestore, TransactionConstants.COLLECTION_RECURRING_TRANSACTION);
        return addDoc(transactionCollection, transaction);
    }

    getTransactions(COLLECTION_NAME: string) {
        const usersRef = collection(this.firestore, COLLECTION_NAME);
        return collectionData(usersRef, { idField: 'id' });
    }

    updateData(COLLECTION_REF: string, data: any) {
        const docRef = doc(this.firestore, COLLECTION_REF);
        return updateDoc(docRef, data);
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
        let netTrans: Transaction[] = [];
        recTrans.forEach(item => {
            if(item.date.includes('/')) {
                const [day, month, year] = (item.date || '').split('/').map(Number);
                day <= currentDate && netTrans.push(item);
            } else if(item.date.includes('-')) {
                const [year, month, day] = (item.date || '').split('-').map(Number);
                day <= currentDate && netTrans.push(item);
            }            
        });
        for (let i = 0; i < netTrans.length; i++) { 
            for (let j = 0; j < currentMonthTranx.length; j++) { 
                if (currentMonthTranx[j].category === netTrans[i].category && currentMonthTranx[j].type === values.type) { 
                    const idx = netTrans.indexOf(netTrans[i]);
                    idx > -1 && netTrans.splice(idx, 1);
                    break; 
                }
            } 
        }
        netTrans.push(values);
        return netTrans;
    }
}