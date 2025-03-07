import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { AccountPosition, Quote, Currency as Currency, AccountBalanceQuote, AccountTypeEnum } from '../model/domain.model';
import { QuoteService } from './quote.service';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  private quoteService = inject(QuoteService);

  constructor() { }

  getAllBalances() : Observable<AccountPosition[]>{
    const saldos: AccountPosition[] = [
      {
        id: '1', account: 'Itaú', balance: 370.36, currency: Currency.BRL,
        type: AccountTypeEnum.CHECKING
      },
      {
        id: '2', account: 'NuBank', balance: 11.07, currency: Currency.BRL,
        type: AccountTypeEnum.CHECKING
      },
      {
        id: '3', account: 'Nu Bank Finfor', balance: 0, currency: Currency.BRL,
        type: AccountTypeEnum.CHECKING
      },
      {
        id: '4', account: 'Rico', balance: 0, currency: Currency.BRL,
        type: AccountTypeEnum.CHECKING
      },
      {
        id: '5', account: 'Rico Inv.', balance: 0, currency: Currency.BRL,
        type: AccountTypeEnum.INVESTMENT
      },
      {
        id: '6', account: 'Nomad', balance: 1.36, currency: Currency.USD,
        type: AccountTypeEnum.CHECKING
      },
      {
        id: '7', account: 'BMG Vasco', balance: 0, currency: Currency.BRL,
        type: AccountTypeEnum.INVESTMENT
      },
      {
        id: '8', account: 'BTG', balance: -10.54, currency: Currency.BRL,
        type: AccountTypeEnum.CHECKING
      },
      {
        id: '9', account: 'BTG Inv.', balance: 0, currency: Currency.BRL,
        type: AccountTypeEnum.INVESTMENT
      },
      {
        id: '10', account: 'XP', balance: 0, currency: Currency.BRL,
        type: AccountTypeEnum.CHECKING
      },
      {
        id: '11', account: 'XP Inv.', balance: 386.49, currency: Currency.BRL,
        type: AccountTypeEnum.INVESTMENT
      },
      {
        id: '12', account: 'Binance', balance: 0, currency: Currency.USD,
        type: AccountTypeEnum.INVESTMENT
      }
    ];

    return of(saldos);
  }

  getBalanceQuotationByCurrency(currency: Currency) {
    return forkJoin({
      acc: this.getAllBalances(),
      quotes: this.quoteService.getAllQuotations()
    }).pipe(
      map(balances => {
        return balances.acc.map(acc => {
          const quote = balances.quotes.find(c => c.from === acc.currency && c.to === currency);
          return {...acc,
            balanceQuote: acc.balance * (quote?.factor || 1),
          } as AccountBalanceQuote;
        });
      })
    )
  }

}
