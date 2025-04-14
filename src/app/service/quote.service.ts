import { computed, inject, Injectable, signal } from '@angular/core';
import { Currency, CurrencyType, KeyTypeOf } from '../model/domain.model';
import { ExchangeStructureType, MarketPlaceEnum } from '../model/investment.model';
import { AssetQuoteRecord, AssetQuoteType, SummarizedDataType } from '../model/source.model';
import { RemoteQuotesService } from './remote-quotes.service';
import { SourceService } from './source.service';

export const getMarketPlaceCode = ({ marketPlace, code }: { marketPlace: string | MarketPlaceEnum; code: string; }): string => {
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

  private sourceService = inject(SourceService);

  private remoteQuotesService = inject(RemoteQuotesService);

  readonly quotePendding = signal<AssetQuoteType | undefined>(undefined);

  readonly quotes = computed(()=> {
    console.log(`quotes: ${this.quotePendding()}`);
    return Object.entries(this.sourceService.assertSource()).reduce((acc, [ticker, asset])=>{
      acc[ticker] = {
        ...asset,
        lastUpdate: new Date(asset.lastUpdate),
        quote: {
          ...asset.quote,
          currency: Currency[asset.quote.currency as keyof typeof Currency]
        },
        initialPrice: asset.quote.value
      }
      return acc;
    }, {} as AssetQuoteRecord);
  })
  
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

  constructor() {}

  getExchangeQuote(from: Currency, to: Currency) {
    return this.exchanges()[from][to];
  }

  exchange(value: number, from: Currency, to: Currency) {
    return ({
      currency: to,
      value: value * this.getExchangeQuote(from, to)
    });
  }

  enhanceExchangeInfo<T, K extends keyof T>(obj: T, originalCurrency: Currency, properties: K[]): Omit<T, K> & Record<K, ExchangeStructureType> {
    let result = {...obj} as Omit<T, K> & Record<K, ExchangeStructureType>;

    const defaultCurrency = this.sourceService.currencyDefault();

    properties.forEach(prop=>{
      if (typeof obj[prop] === 'number') {
        (result as any)[prop] = {
          original: {
            value: obj[prop] as number,
            currency: originalCurrency
          },
          exchanged: this.exchange(obj[prop] as number, originalCurrency, defaultCurrency)
        }
      }
    })

    return result;
  }

  updateQuoteAsset(asset: AssetQuoteType) {
    const ticker = getMarketPlaceCode(asset);
    const original = this.sourceService.assertSource()[ticker];
    this.remoteQuotesService.getRemoteQuote(asset.marketPlace, asset.code).subscribe(quote => {
      asset = { ...original, ...asset,
        quote: {
          value: quote.price,
          currency: quote.currency
        }
      }
    })
    this.quotePendding.set(asset);
  }
}
