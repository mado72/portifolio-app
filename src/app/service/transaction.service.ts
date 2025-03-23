import { computed, Injectable, signal } from '@angular/core';
import { parseISO } from 'date-fns';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import transactionsSource from '../../data/transactions.json';
import { Currency } from '../model/domain.model';
import { TransactionEnum, TransactionStatus, TransactionType } from '../model/investment.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  transactionsData = signal({} as Record<string, TransactionType>);

  transactionSignal = computed(() => {
    const data = this.transactionsData();
    const values = Object.values(data).slice();
    return values;
  })

  constructor() {
    const data = (transactionsSource.data.slice().map(item => ({
      ...item,
      date: parseISO(item.date),
      type: TransactionEnum[item.type as keyof typeof TransactionEnum],
      status: TransactionStatus[item.status as keyof typeof TransactionStatus],
      value: {
        ...item.value,
        currency: Currency[item.value.currency as keyof typeof Currency]
      }
    } as TransactionType))
      .reduce((acc, item) => {
        acc[item.id as string] = item;
        return acc;
      }, {} as Record<string, TransactionType>));
    this.transactionsData.set(data);
  }

  getTransactionsDatasourceComputed() {
    return computed(() => {
      const data = this.transactionsData();
      const transactions = Object.values(data);
      return transactions;
    })
  }

  saveTransaction(result: TransactionType) {
    return new Observable<TransactionType>(observer => {
      const items = { ...this.transactionsData() }; // Creates a copy of the current state
      result.id = result.id || uuid(); // Generates an ID if it doesn't exist
      items[result.id] = result; // Adds or updates the transaction

      this.transactionsData.set(items); // Updates the signal with the new object

      observer.next(result);
      observer.complete();
    });
  }

  deleteTransaction(id: string) {
    return new Observable<void>(observer => {
      const items = { ...this.transactionsData() }; // Creates a copy of the current state
      delete items[id]; // Removes the transaction by ID

      this.transactionsData.set(items); // Updates the signal with the new object

      observer.next();
      observer.complete();
    });
  }
}
