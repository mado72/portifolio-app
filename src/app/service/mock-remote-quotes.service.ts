import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'any',
  
})
export class MockRemoteQuotesService implements IRemoteQuote {

  private cacheQuotes: { [ticker: string]: QuoteResponse } = {};

  constructor(private sourceService: SourceService) { 
    if (!sourceService) 
      throw new Error("SourceService is not available");
  }

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
        name: ticker,
        symbol: ticker,
        currency: asset.quote.currency,
        open: asset.quote.value,
        high: asset.quote.value,
        low: asset.quote.value,
        price: asset.quote.value,
        volume: asset.quote.value,
        lastUpdate: asset.lastUpdate,
        previousClose: asset.quote.value,
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
