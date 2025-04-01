import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { differenceInMinutes } from 'date-fns';
import { firstValueFrom, forkJoin, map, Observable, of, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { Currency } from '../model/domain.model';
import { MarketPlaceEnum, MarketPlaceType } from '../model/investment.model';
import { AssetQuoteRecord, AssetQuoteType, fnTrend } from '../model/source.model';
import { getMarketPlaceCode } from './quote.service';
import { SourceService } from './source.service';

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

@Injectable({
  providedIn: 'root'
})
export class RemoteQuotesService {

  private sourceService = inject(SourceService);

  private http = inject(HttpClient);

  assetsQuoted = signal< Record<string, AssetQuoteType> >({});

  assetsPendding = computed(() => {
    const assets = this.sourceService.assertSource();
    const quotes = this.assetsQuoted();
    return Object.entries(assets).filter(([ticker, _]) =>!quotes[ticker] || differenceInMinutes(new Date(), quotes[ticker].lastUpdate) > 15)
      .reduce((acc, [ticker, asset])=>{
        acc[ticker] = asset;
        return acc;
      }, {} as {[ticker: string]: AssetQuoteType})
  })

  timerId = timer(15 * 60 * 1000).pipe(
    map(() => {
      const assets = this.sourceService.assertSource();
      this.assetsQuoted.set(assets);
      return this.prepareRequestsToUpdateQuotes(assets);
    })
  ).subscribe(assets => {
    this.sourceService.updateAsset(Object.values(assets));
  });

  constructor() {
    effect(async () => {
      const pending = this.assetsPendding();
      const assets = Object.values(await firstValueFrom (this.prepareRequestsToUpdateQuotes(pending)));
      this.sourceService.updateAsset(assets);
    }, {
      allowSignalWrites: true
    })
  }

  destroy() {
    this.timerId.unsubscribe();
  }

  readonly lastUpdate = signal<Date>(new Date());

  private cacheQuotes: { [ticker: string]: QuoteResponse } = {};

  readonly quotesRequests = computed(() => {
    const assets = this.sourceService.assertSource();
    return this.prepareRequestsToUpdateQuotes(assets);
  });

  private prepareRequestsToUpdateQuotes(assets: Record<string, AssetQuoteType>) {
    const lastUpdate = this.lastUpdate();
    const requests = Object.entries(assets).reduce((acc, [key, asset]) => {
      const ticker = getMarketPlaceCode(asset);
      if (differenceInMinutes(lastUpdate, asset.lastUpdate) > 15) {
        acc[key] = this.marketPlaceQuoteFn(asset.marketPlace as MarketPlaceType, ticker);
      }
      else {
        acc[key] = of(this.cacheQuotes[ticker]);
      }
      return acc;
    }, {} as { [key: string]: Observable<QuoteResponse>; });

    return forkJoin(requests).pipe(
      map(quotes => Object.entries(quotes).reduce((acc, [ticker, quote]) => {
        acc[ticker] = {
          ...assets[ticker],
          lastUpdate: new Date(),
          quote: {
            price: quote.price,
            currency: quote.currency
          },
          initialPrice: quote.open,
          trend: fnTrend({...assets[ticker], quote})
        };
        this.cacheQuotes[ticker] = quote;
        return acc;
      }, {} as AssetQuoteRecord))
    )
  }

  quoteMock(ticker: string) {
    const asset = this.sourceService.assertSource()[ticker];
    let quote = this.cacheQuotes[ticker];
    if (!quote) {
      quote = {
        symbol: ticker,
        currency: asset.quote.currency,
        open: asset.quote.price,
        high: asset.quote.price,
        low: asset.quote.price,
        price: asset.quote.price,
        volume: asset.quote.price,
        lastUpdate: asset.lastUpdate,
        previousClose: asset.quote.price,
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

  marketPlaceQuoteFn(marketPlace: keyof typeof MarketPlaceEnum, ticker: string) {
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
