import { effect, Injectable, signal } from '@angular/core';
import assetSource from '../../data/assets.json';
import { Currency, CurrencyType } from '../model/domain.model';
import { AssetQuoteRecord } from '../model/investment.model';

export const getMarketPlaceCode = ({ marketPlace, code }: { marketPlace: string; code: string; }): string => {
  return marketPlace ? `${marketPlace}:${code}` : code;
}

export type ExchangeReq = {
  from: CurrencyType,
  to: CurrencyType
}

export type ExchangeType = ExchangeReq & {
  factor?: number
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  readonly quotes = signal<AssetQuoteRecord>(assetSource.data.reduce((acc, asset)=>{
    const code = getMarketPlaceCode({ marketPlace: asset.marketPlace, code: asset.code });
    acc[code] = {
      lastUpdate: new Date(asset.lastUpdate),
      quote: {
        ...asset.quote,
        currency: Currency[asset.quote.currency as keyof typeof Currency]
      },
      initialQuote: asset.quote.amount
    }
    return acc;
  }, {} as AssetQuoteRecord));

  readonly exchanges = signal<Record<CurrencyType, Record<CurrencyType, number>>>(
    [
      { date: new Date(), from: Currency.BRL, to: Currency.USD, factor: 1/5.76 },
      { date: new Date(), from: Currency.USD, to: Currency.BRL, factor: 5.76 },
      { date: new Date(), from: Currency.BRL, to: Currency.UTC, factor: 1/5.90 },
      { date: new Date(), from: Currency.UTC, to: Currency.BRL, factor: 5.90 },
      { date: new Date(), from: Currency.EUR, to: Currency.BRL, factor: 6.21 }
    ].reduce((acc, item) => {
      acc[item.from] = acc[item.from] || {};
      acc[item.from][item.to] = item.factor;
      acc[item.from][item.from] = 1;
      acc[item.to] = acc[item.to] || {};
      acc[item.to][item.to] = 1;
      return acc;
    }, {} as Record<CurrencyType, Record<CurrencyType, number>>));

  readonly lastUpdate = signal<{code: string, before: number, after: number}>({code: '', before: 0, after: 0});

  timerId: any;

  constructor() {
    this.forceChangeQuoteMock();
    
    this.timerId = setInterval(() => {
      this.forceChangeQuoteMock();
    }, 30000);
  }

  private forceChangeQuoteMock() {
    const aux: AssetQuoteRecord = { ...this.quotes() };
    const assetsCode = Object.keys(this.quotes());

    for (let i = 0; i < 10; i++) {
      const idx = Math.trunc(Math.random() * assetsCode.length);

      const code = assetsCode[idx];

      const before = aux[code].quote.amount;
      aux[code].quote.amount *= (105 - 10 * Math.random()) / 100;
      aux[code].lastUpdate = new Date();
      const after = aux[code].quote.amount;
      this.lastUpdate.set({ code, before, after });
    }
    // console.debug({code, before, after});
    this.quotes.set(aux);
  }

  destroy() {
    clearInterval(this.timerId);
  }

  getExchangeQuote(de: Currency, para: Currency) {
    return this.exchanges()[de][para];
  }

}
