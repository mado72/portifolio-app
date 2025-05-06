import { inject, Injectable } from '@angular/core';
import { Currency, CurrencyType, Exchange } from '../model/domain.model';
import { ChartResultArray, YahooRemoteQuotesService } from './yahoo-remote-quotes.service';
import { map, Observable } from 'rxjs';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';
import { addMonths, differenceInMonths } from 'date-fns';

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
  
        return this.generateCurrencyExchangeMap(rates);
      })
    )
  }

  getExchangesHistory(startDate: Date, endDate: Date): Observable<Record<CurrencyType, Record<CurrencyType, number[]>>> {
    const symbols = Object.values(Currency).filter(c => c !== Currency.USD).map(c => `COIN:${c}`);
    const diffMonths = differenceInMonths(endDate, startDate) + 1;

    return this.yahooService.getHistorical(symbols, startDate, endDate).pipe(
      map((history: Record<string, ChartResultArray>) => {
        const ratesUSDToCurrency = Object.entries(history).reduce((acc, [ticker, q]) => {
          const [_, symbol] = ticker.split(":");
          const currency = Currency[symbol as keyof typeof Currency];

          const quotesCurrency = q.quotes.reduce((accQ, quote, index) => {
            accQ[index] = quote.close || NaN;
            return accQ;
          }, Array(diffMonths + 1).fill(0) as number[]);

          acc[currency] = quotesCurrency;
          return acc;
        }, {
          USD: Array(diffMonths + 1).fill(1)
        } as Partial<Record<Currency, number[]>>);

        // Generate the full exchange map for each month
        const ratesPeriod = Array.from({ length: diffMonths }, (_, monthIndex) => {
          const monthlyRates = Object.entries(ratesUSDToCurrency).reduce((acc, [currency, rates]) => {
            acc[currency as CurrencyType] = rates[monthIndex];
            return acc;
          }, {} as Partial<Record<Currency, number>>);

          return this.generateCurrencyExchangeMap(monthlyRates);
        });

        // Merge all months into a single structure
        return ratesPeriod.reduce((acc, monthlyMap) => {
          Object.entries(monthlyMap).forEach(([from, toRates]) => {
            acc[from as CurrencyType] = acc[from as CurrencyType] || {};
            Object.entries(toRates).forEach(([to, rate]) => {
              acc[from as CurrencyType][to as CurrencyType] = acc[from as CurrencyType][to as CurrencyType] || [];
              acc[from as CurrencyType][to as CurrencyType].push(rate);
            });
          });
          return acc;
        }, {} as Record<CurrencyType, Record<CurrencyType, number[]>>);
      })
    );
  }

  private generateCurrencyExchangeMap(rates: Partial<Record<Currency, number>>) {
    const entries = Object.entries(rates).reduce((acc, [c, factor]) => {
      const currency = Currency[c as keyof typeof Currency];
      acc[currency] = acc[currency] || {};
      acc[currency][Currency.USD] = 1 / factor;
      acc[Currency.USD][currency] = factor;
      return acc;
    }, {
      "USD": {}
    } as Record<CurrencyType, Record<CurrencyType, number>>);

    const otherCurrencies = Object.values(Currency).filter(c => c !== Currency.USD);
    otherCurrencies.forEach(from => {
      otherCurrencies.forEach(to => {
        entries[from][to] = entries[from][Currency.USD] / entries[to][Currency.USD];
      });
    });

    return entries;
  }
}
