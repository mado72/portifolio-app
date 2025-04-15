import { CurrencyPipe } from '@angular/common';
import { computed, inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { Currency, CurrencyType } from '../model/domain.model';
import { ExchangeStructureType, ExchangeView, MarketPlaceEnum } from '../model/investment.model';
import { AssetQuoteRecord, AssetQuoteType } from '../model/source.model';
import { RemoteQuotesService } from './remote-quotes.service';
import { SourceService } from './source.service';
import { map } from 'rxjs';

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

  readonly exchangeView = signal<ExchangeView>("original");

  readonly quotePendding = signal<AssetQuoteType | undefined>(undefined);

  private currencyPipe = new CurrencyPipe(inject(LOCALE_ID));

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
  
  readonly exchanges = computed(()=> this.remoteQuotesService.exchanges());
  constructor() {

  }

  toggleExchangeView() {
    this.exchangeView.update(exchangeView => (exchangeView === "original" ? "exchanged" : "original"));
  }

  getExchangeQuote(from: Currency, to: Currency) {
    const exchanges = this.exchanges();
    return exchanges[from]?.[to];
  }

  exchange(value: number, from: Currency, to: Currency) {
    return ({
      currency: to,
      value: value * this.getExchangeQuote(from, to)
    });
  }

  currencyToSymbol(currency: Currency | string): string {
    const result = this.currencyPipe.transform(1, currency, "symbol", "1.0")?.replace(/\d/, '');
    return result || currency;
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
    if (! asset.manualQuote) {
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
    else {
      this.sourceService.updateAsset([asset]);
    }
  }

  getRemoteQuote(ticker: string) {
    const [marketPlace, code] = ticker.includes(':') ? ticker.split(':') : ['', ticker];
    return this.remoteQuotesService.getRemoteQuote(marketPlace, code).pipe(
      map(resp => {
        if (!!resp) {
          return resp.price;
        }
        return null;
      })
    )
  }
}
