import { computed, Injectable, signal } from '@angular/core';
import { Exchange, Currency, CurrencyAmount } from '../model/domain.model';
import { map, Observable, of } from 'rxjs';
import assetSource from '../../data/assets.json';
import { AssetQuoteRecord, QuoteExchangeInfo } from '../model/investment.model';

export const getMarketPlaceCode = ({ marketPlace, code }: { marketPlace: string; code: string; }): string => {
  return marketPlace ? `${marketPlace}:${code}` : code;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  readonly quotes = signal<AssetQuoteRecord>({});

  readonly lastUpdate = signal<{code: string, before: number, after: number}>({code: '', before: 0, after: 0});

  timerId: any;

  constructor() {
    const records = assetSource.data.reduce((acc, asset)=>{
      const code = getMarketPlaceCode({ marketPlace: asset.marketPlace, code: asset.code });
      acc[code] = {
        lastUpdate: new Date(asset.lastUpdate),
        quote: {
          amount: asset.price,
          currency: Currency[asset.currency as keyof typeof Currency]
        },
        initialQuote: asset.price
      }
      return acc;
    }, {} as AssetQuoteRecord)

    this.quotes.set(records);

    this.timerId = setInterval(() => {
      const aux: AssetQuoteRecord = {...this.quotes()};
      const assetsCode = Object.keys(this.quotes());

      for (let i = 0; i < 10; i++) {
        const idx = Math.trunc(Math.random() * assetsCode.length);
  
        const code = assetsCode[idx];
  
        const before = aux[code].quote.amount;
        aux[code].quote.amount *= .01 * (105 - 10 * Math.random());
        aux[code].lastUpdate = new Date();
        const after = aux[code].quote.amount;
        this.lastUpdate.set({code, before, after});
      }
      // console.debug({code, before, after});

      this.quotes.set(aux);
    }, 30000);
  }

  destroy() {
    clearInterval(this.timerId);
  }

  getAllExchanges(): Observable<Exchange[]> {
    // Simulação de chamada à API de cotação
    const cotacoes: Exchange[] = [
      { date: new Date(), from: Currency.BRL, to: Currency.USD, factor: 1/5.76 },
      { date: new Date(), from: Currency.USD, to: Currency.BRL, factor: 5.76 },
      { date: new Date(), from: Currency.BRL, to: Currency.UTC, factor: 1/5.90 },
      { date: new Date(), from: Currency.UTC, to: Currency.BRL, factor: 5.90 }
    ];
    return of(cotacoes);
  }

  getExchangeQuote(de: Currency, para: Currency) {
    return this.getAllExchanges().pipe(
      map(cotacoes => cotacoes.find(c => c.from === de && c.to === para))
    );
  }

  getExchangeFactor(code: string, marketPlace: string, toCurrency: Currency): Observable<QuoteExchangeInfo> {
    const asset = assetSource.data.find(a => a.code === code && a.marketPlace === marketPlace);
    if (!asset)
      throw `${getMarketPlaceCode({ marketPlace, code })} not found`;

    const fromCurrency: Currency = Currency[asset.currency as keyof typeof Currency];

    return this.getExchangeQuote(fromCurrency, toCurrency).pipe(
      map(exchange => {
        if (!exchange)
          throw `Exchange rate from ${fromCurrency} to ${toCurrency} not found`;

        asset.price = this.quotes()[getMarketPlaceCode({ marketPlace: asset.marketPlace, code: asset.code })].quote.amount;

        return {
          original: {
            amount: asset.price,
            currency: fromCurrency
          },
          value: {
            amount: asset.price * exchange.factor,
            currency: toCurrency
          },
          exchange
        };
      })
    )
  }

}
