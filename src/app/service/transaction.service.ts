import { Injectable } from '@angular/core';
import transactionsSource from '../../data/transactions.json';
import { map, Observable, of } from 'rxjs';
import { TransactionEnum, TransactionStatus, TransactionType } from '../model/investment.model';
import { parse, parseISO } from 'date-fns';
import { Currency } from '../model/domain.model';
import { TransactionTypePipe } from '../transaction/transaction-type.pipe';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor() { }

  private transactionsData = transactionsSource.data.map(item => ({
    ...item,
    date: parseISO(item.date),
    type: TransactionEnum[item.type as keyof typeof TransactionEnum],
    status: TransactionStatus[item.status as keyof typeof TransactionStatus],
    value: {
      ...item.value,
      currency: Currency[item.value.currency as keyof typeof Currency]
    }
  } as TransactionType
  ));

  getTransactions(): Observable<TransactionType[]> {
    return of(this.transactionsData);
  }

}
