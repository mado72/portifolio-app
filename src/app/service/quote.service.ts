import { CurrencyPipe } from '@angular/common';
import { computed, effect, inject, Injectable, LOCALE_ID, OnDestroy, signal } from '@angular/core';
import { differenceInMinutes, max, minutesToMilliseconds } from 'date-fns';
import { concatMap, debounceTime, from, map, of, Subject, switchMap, tap, throttleTime } from 'rxjs';
import { Currency, CurrencyType } from '../model/domain.model';
import { ExchangeStructureType, ExchangeView, MarketPlaceEnum } from '../model/investment.model';
import { AssetQuoteRecord, AssetQuoteType, Ticker } from '../model/source.model';
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
export class QuoteService implements OnDestroy {

  private sourceService = inject(SourceService);

  private remoteQuotesService = inject(RemoteQuotesService);

  readonly exchangeView = signal<ExchangeView>("original");

  readonly quotePendding = signal<Set<string>>(new Set());

  readonly lastUpdate = signal<Date>(new Date(0));

  private currencyPipe = new CurrencyPipe(inject(LOCALE_ID));

  readonly quotes = computed(() => {
    return Object.entries(this.sourceService.assetSource()).reduce((acc, [ticker, asset]) => {
      acc[ticker] = {
        ...asset,
        lastUpdate: max([this.lastUpdate(), new Date(asset.lastUpdate)]),
        quote: {
          ...asset.quote,
          currency: Currency[asset.quote.currency as keyof typeof Currency]
        },
        initialPrice: asset.quote.value // TODO: Verificar se o valor está vindo corretamente.
      }
      return acc;
    }, {} as AssetQuoteRecord);
  })

  updateTrigger = new Subject<Record<Ticker, AssetQuoteType>>();
  private subscription = this.updateTrigger.pipe(
    throttleTime(1 * 60 * 1000),
    switchMap(request => this.remoteQuotesService.updateQuotes(request))).subscribe(_=> {
      this.lastUpdate.set(new Date());
      this.quotePendding.set(new Set());
    })

  readonly exchanges = computed(() => this.remoteQuotesService.exchanges());
  constructor() {
    effect(() => {
      const lastUpdate = this.lastUpdate();
      const assets = this.sourceService.assetSource();
      const pending = this.quotePendding();
      this.effectPendingAssetsLastUpdate(pending, assets, lastUpdate);
    })
  }

  private effectPendingAssetsLastUpdate(pending: Set<string>, assets: Record<string, AssetQuoteType>, lastUpdate: Date) {
    if (!pending) return;

    const request = Array.from(pending)
      .concat(Object.values(assets)
        .filter(asset => Math.abs(differenceInMinutes(lastUpdate, asset.lastUpdate)) > 10)
        .map(asset => asset.ticker))
      .reduce((acc, ticker) => {
        acc[ticker] = { ...assets[ticker] };
        return acc;
      }, {} as Record<string, AssetQuoteType>);

    if (Object.keys(request).length || differenceInMinutes(new Date(), lastUpdate) > 10) {
      this.updateTrigger.next(request);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();  
  }

  addPendding(ticker: Ticker) {
    const asset = this.sourceService.assetSource()[ticker];
    if (asset) {
      this.quotePendding.update(set => set.add(ticker));
      const request = {} as AssetQuoteRecord;
      request[ticker] = asset;
      this.updateTrigger.next(request);
    }
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
    let result = { ...obj } as Omit<T, K> & Record<K, ExchangeStructureType>;

    const defaultCurrency = this.sourceService.currencyDefault();

    properties.forEach(prop => {
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
    const original = this.sourceService.assetSource()[ticker];
    if (!asset.manualQuote) {
      this.remoteQuotesService.getRemoteQuote(asset.marketPlace, asset.code).subscribe(quote => {
        asset = {
          ...original, ...asset,
          quote: {
            value: quote.price,
            currency: quote.currency
          }
        }
      })
      this.quotePendding.update(set => set.add(asset.ticker))
    }
    else {
      this.sourceService.updateAsset([asset]);
    }
  }

  getRemoteAssetInfo(ticker: string) {
    const [marketPlace, code] = ticker.includes(':') ? ticker.split(':') : ['', ticker];
    return this.remoteQuotesService.getRemoteQuote(marketPlace, code);
  }

  getRemoteQuote(ticker: string) {
    return this.getRemoteAssetInfo(ticker).pipe(
      map(resp => {
        if (!!resp) {
          return resp.price;
        }
        return null;
      })
    )
  }
}
