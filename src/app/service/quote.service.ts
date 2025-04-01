import { computed, effect, inject, Injectable, signal } from '@angular/core';
import assetSource from '../../data/assets.json';
import { Currency, CurrencyType } from '../model/domain.model';
import { AssetQuoteRecord, MarketPlaceEnum, MarketPlaceType, TrendType } from '../model/investment.model';
import { forkJoin, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { SourceService } from './source.service';
import { differenceInMinutes, parse } from 'date-fns';
import { toSignal } from '@angular/core/rxjs-interop';

export const getMarketPlaceCode = ({ marketPlace, code }: { marketPlace: string; code: string; }): string => {
  return marketPlace ? `${marketPlace}:${code}` : code;
}

type QuoteResponse = {
  symbol: string,
  currency: Currency,
  open: number,
  high: number,
  low: number,
  price: number,
  volume: number,
  lastUpdate: Date,
  previousClose?: number,
  change?: number,
  changePercent?: number
}

type MarketPlaceQuoteFn = (ticker: string) => Observable<QuoteResponse>;

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

  private http = inject(HttpClient);
  
  readonly lastUpdate = signal<Date>(new Date());

  private cacheQuotes : {[ticker: string] : QuoteResponse} = {};

  readonly quotesRequests = computed(() => {
    const lastUpdate = this.lastUpdate()
    const assets = this.sourceService.assertSource();
    const requests = Object.entries(assets).reduce((acc, [key, asset])=>{
        const ticker = getMarketPlaceCode(asset);
        if (differenceInMinutes(lastUpdate, asset.lastUpdate) > 15) {
          acc[key] = this.marketPlaceQuoteFn(asset.marketPlace as MarketPlaceType, ticker)
        }
        else {
          acc[key] = of(this.cacheQuotes[ticker])
        }
        return acc;
      }, {} as {[key: string]: Observable<QuoteResponse>});
    
    return forkJoin(requests).pipe(
      map(quotes => Object.entries(quotes).reduce((acc, [ticker, quote]) => {
        const trend: TrendType = quote.open === quote.price? 'unchanged' : quote.open < quote.price? 'up' : 'down';
        acc[ticker] = {
         ...assets[ticker],
          lastUpdate: new Date(),
          quote: {
            amount: quote.price,
            currency: quote.currency
          },
          initialQuote: quote.open,
          trend
        };
        this.cacheQuotes[ticker] = quote;
        return acc;
      }, {} as AssetQuoteRecord))
    )
  });
  
  quotes = toSignal(this.quotesRequests());

  // readonly quotes1 = signal<AssetQuoteRecord>(assetSource.data.reduce((acc, asset)=>{
  //   const code = getMarketPlaceCode({ marketPlace: asset.marketPlace, code: asset.code });
  //   acc[code] = {
  //     lastUpdate: new Date(asset.lastUpdate),
  //     quote: {
  //       ...asset.quote,
  //       currency: Currency[asset.quote.currency as keyof typeof Currency]
  //     },
  //     initialQuote: asset.quote.amount
  //   }
  //   return acc;
  // }, {} as AssetQuoteRecord));

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

  timerId: any;

  constructor() {
    this.timerId = setInterval(() => {
      this.lastUpdate.set(new Date())
    }, 30000);
  }

  destroy() {
    clearInterval(this.timerId);
  }

  getExchangeQuote(de: Currency, para: Currency) {
    return this.exchanges()[de][para];
  }

  quoteMock(ticker: string) {
    const asset = this.sourceService.assertSource()[ticker];
    let quote = this.cacheQuotes[ticker];
    if (!quote) {
      quote = {
        symbol: ticker,
        currency: asset.quote.currency,
        open: asset.quote.amount,
        high: asset.quote.amount,
        low: asset.quote.amount,
        price: asset.quote.amount,
        volume: asset.quote.amount,
        lastUpdate: asset.lastUpdate,
        previousClose: asset.quote.amount,
        change: 0,
        changePercent: 0
      }
    }
    else {
      quote.price *= (105 - 10 * Math.random()) / 100;
      quote.lastUpdate = new Date();
    }

    this.cacheQuotes = {
      ... this.cacheQuotes,
      [ticker]: quote
    }
    return of(quote);
  }

  quoteBVMF(ticker: string) {
    const [_, code] = ticker.split(':');
    const url = environment.marketPlace.BVMF.apiUrl.replace(/\{code\}/g, code);
    return this.http.get<any>(url).pipe(
      map(response => ({
        symbol: response['Global Quote']['01. symbol'],
        currency: Currency.BRL,
        open: parseFloat(response['Global Quote']['02. open']),
        high: parseFloat(response['Global Quote']['03. high']),
        low: parseFloat(response['Global Quote']['04. low']),
        price: parseFloat(response['Global Quote']['05. price']),
        volume: parseFloat(response['Global Quote']['06. volume']),
        lastUpdate: new Date(),
        previousClose: parseFloat(response['Global Quote']['08. previous close']),
        change: parseFloat(response['Global Quote']['09. change']),
        changePercent: parseFloat(response['Global Quote']['10. change percent'])
      } as QuoteResponse))
    )
  }

  
  marketPlaceQuoteFn (marketPlace : keyof typeof MarketPlaceEnum, ticker: string) {
    switch (marketPlace) {
      case MarketPlaceEnum.BVMF: return this.quoteBVMF(ticker);
      case MarketPlaceEnum.COIN: return this.quoteMock(ticker);
      case MarketPlaceEnum.CRYPTO: return this.quoteMock(ticker);
      case MarketPlaceEnum.FOREX: return this.quoteMock(ticker);
      case MarketPlaceEnum.IEX: return this.quoteMock(ticker);
      case MarketPlaceEnum.NASDAQ: return this.quoteMock(ticker);
      case MarketPlaceEnum.NYSE: return this.quoteMock(ticker);
      case MarketPlaceEnum.BRTD: return this.quoteMock(ticker);
    }
    return this.quoteMock(ticker);
  }

}
