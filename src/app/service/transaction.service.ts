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

  transactionsData = signal(transactionsSource.data.slice().map(item => ({
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

  transactionSignal = computed(()=>{
    const values = Object.values(this.transactionsData()).slice();
    console.log(values);
    return values;
  })

  getTransactionsDatasourceComputed() {
    return computed(() => {
      const transactions = Object.values(this.transactionsData());
      return transactions;
    })
  }

  saveTransaction(result: TransactionType) {
    return new Observable<TransactionType>(observer => {
      const items = {...this.transactionsData()};
      result.id = result.id || uuid();
      items[result.id] = result;

      this.transactionsData.set(items);

      observer.next(result);
      observer.complete();
    })
  }

  deleteTransaction(id: string) {
    return new Observable<void>(observer => {
      const items = {...this.transactionsData()};
      delete items[id];
      this.transactionsData.set(items);
      
      observer.next();
      observer.complete();
    })
  }
}
