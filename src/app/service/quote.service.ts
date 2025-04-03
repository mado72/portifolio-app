import { computed, effect, inject, Injectable, signal } from '@angular/core';
import assetSource from '../../data/assets.json';
import { Currency, CurrencyType } from '../model/domain.model';
import { AssetEnum, AssetQuoteRecord, AssetQuoteType } from '../model/source.model';
import { SourceService } from './source.service';
import { MarketPlaceEnum } from '../model/investment.model';
import { RemoteQuotesService } from './remote-quotes.service';

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
        initialPrice: asset.quote.price
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

  constructor() {
    effect(() => {
      const pendding = this.quotePendding();
      console.debug(`effect pendding`, pendding);
      // if (pendding && ! this.sourceService.assertSource()[getMarketPlaceCode(pendding)]) {
      //   this.updateQuote(pendding);
      // }
    })
  }

  getExchangeQuote(de: Currency, para: Currency) {
    return this.exchanges()[de][para];
  }

  // protected updateQuote(asset: AssetQuoteType) {
  //   const ticker = getMarketPlaceCode(asset);
  //   this.remoteQuotesService.updateQuotes({ [ticker]: asset });
  //   this.quotePendding.set(undefined);
  // }

  updateQuoteAsset(asset: AssetQuoteType) {
    const ticker = getMarketPlaceCode(asset);
    const original = this.sourceService.assertSource()[ticker];
    this.remoteQuotesService.getRemoteQuote(asset.marketPlace, asset.code).subscribe(quote => {
      asset = { ...original, ...asset,
        quote: {
          price: quote.price,
          currency: quote.currency
        }
      }
    })
    this.quotePendding.set(asset);
  }
}
