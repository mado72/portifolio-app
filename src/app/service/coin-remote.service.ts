import { inject, Injectable } from '@angular/core';
import { Currency, CurrencyType, Exchange } from '../model/domain.model';
import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';
import { map, Observable } from 'rxjs';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';

const REFERENCE_COIN = Currency.USD;

@Injectable({
  providedIn: 'root'
})
export class CoinService {

  private yahooService = inject(YahooRemoteQuotesService);

  constructor() { }

  getExchanges(): Observable<Record<CurrencyType, Record<CurrencyType, number>>> {
    const symbols = Object.values(Currency).filter(c=>c !== Currency.USD).map(c=>`COIN:${c}`);

    return this.yahooService.priceWithSingleRequest(symbols).pipe(
      map(quotes => {
        const rates = Object.entries(quotes).reduce((acc, [ticker, q])=> {
          const [_, symbol] = ticker.split(":");
          const currency = Currency[symbol as keyof typeof Currency];
          acc[currency]  = q.price;
          return acc;
        }, {
          USD: 1
        } as Partial<Record<Currency, number>>)
  
        const entries = Object.entries(rates).reduce((acc, [c, factor])=>{
          const currency = Currency[c as keyof typeof Currency];
          acc[currency] = acc[currency] || {};
          acc[currency][Currency.USD] = factor;
          acc[Currency.USD][currency] = 1/factor;
          return acc;        
        }, {
          "USD": {}
        } as Record<CurrencyType, Record<CurrencyType, number>>)

        const otherCurrencies = Object.values(Currency).filter(c=> c!== Currency.USD);
        otherCurrencies.forEach(from=>{
          otherCurrencies.forEach(to=> {
            entries[from][to] = entries[from][Currency.USD] / entries[to][Currency.USD]
          })
        })
  
        return entries;
      })
    )
  }

}
