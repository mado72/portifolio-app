import { inject, Injectable } from '@angular/core';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';
import { forkJoin, map, Observable, of } from 'rxjs';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class MockRemoteQuotesService implements IRemoteQuote {

  private sourceService = inject(SourceService);

  private cacheQuotes: { [ticker: string]: QuoteResponse } = {};

  constructor() { }

  price(tickers: string[]): Observable<Record<string, QuoteResponse>> {
    const requests = tickers.map(ticker => this.fetchQuote(ticker));

    return forkJoin(requests).pipe(
      map(quotes => quotes.reduce((acc, quote) => {
        acc[quote.ticker] = quote;
        return acc;
      }, {} as Record<string, QuoteResponse>))
    );
  }

  fetchQuote(ticker: string): Observable<QuoteResponse> {
    const asset = this.sourceService.assertSource()[ticker];
    const quoteCached = this.cacheQuotes[ticker];
    let quote: QuoteResponse;
    if (!quoteCached) {
      quote = {
        ticker,
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
        changePercent: 0,
      }
    }
    else {
      quote = {...quoteCached,
        price: quoteCached.price * (105 - 10 * Math.random()) / 100,
        lastUpdate: new Date(),
        ticker };
    }

    this.cacheQuotes = {
      ... this.cacheQuotes,
      [ticker]: quote
    }
    return of(quote);
  }
}
