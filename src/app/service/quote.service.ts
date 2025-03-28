import { inject, Injectable, signal } from '@angular/core';
import assetSource from '../../data/assets.json';
import { Currency, CurrencyType } from '../model/domain.model';
import { AssetQuoteRecord } from '../model/source.model';
import { SourceService } from './source.service';

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

  private sourceService = inject(SourceService);
  
  readonly quotes = signal<AssetQuoteRecord>(Object.entries(this.sourceService.assertSource()).reduce((acc, [ticker, asset])=>{
    acc[ticker] = {
      ...asset,
      lastUpdate: new Date(asset.lastUpdate),
      quote: {
        ...asset.quote,
        currency: Currency[asset.quote.currency as keyof typeof Currency]
      },
      initialPrice: asset.quote.price
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

  getExchangeQuote(de: Currency, para: Currency) {
    return this.exchanges()[de][para];
  }
}
