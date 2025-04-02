import { Injectable } from '@angular/core';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';
import { bufferCount, concatMap, delay, forkJoin, from, map, Observable, of, zip, zipAll } from 'rxjs';
import yahooFinance from 'yahoo-finance2';

const BATCH_SIZE = 5;
const INTERVAL_MS = 500;

@Injectable({
  providedIn: 'root'
})
export class YahooRemoteQuotesService implements IRemoteQuote {

  constructor() { }

  price(tickers: string[]): Observable<Record<string, QuoteResponse>> {
    const requests = tickers.reduce((acc, ticker) => {
      acc[ticker] = this.fetchQuote(ticker);
      return acc;
    }, {} as Record<string, Observable<QuoteResponse>>);

    const observables = Object.values(requests);
    return from(observables).pipe(
      // Divide in groups of BATCH_SIZE requests
      bufferCount(BATCH_SIZE),
      // Executes with delay between requests
      concatMap((batch, batchIndex) => {
        const totalBatches = Math.ceil(batch.length / BATCH_SIZE);
        const execBatch = forkJoin(batch);

        const aux = ((batchIndex < totalBatches)
          ? execBatch.pipe(delay(INTERVAL_MS))
          : execBatch);
        return aux;
      }),
      // Combine batches into a single result
      zipAll(),
      // Map the results to a single object with quote data for each ticker
      map(results => {
        return results.reduce((acc, quote) => {
          acc[quote.ticker] = quote;
          return acc;
        }, {} as Record<string, QuoteResponse>);
      })
    )
  }

  fetchQuote(ticker: string) {
    return from(yahooFinance.quote(ticker)).pipe(
      map((response) => {
        return {
          ticker,
          symbol: response.symbol,
          currency: response.currency,
          open: response.regularMarketOpen,
          high: response.regularMarketDayHigh,
          low: response.regularMarketDayLow,
          price: response.regularMarketPrice,
          volume: response.regularMarketVolume,
          lastUpdate: response.regularMarketTime || new Date(),
          previousClose: response.regularMarketPreviousClose,
          change: response.regularMarketChange,
          changePercent: response.regularMarketChangePercent
        } as QuoteResponse
      })
    );
  }
}

export type YahooQuoteResponse = {
  language: string;
  region: string;
  quoteType: string;
  typeDisp: string;
  quoteSourceName: string;
  triggerable: boolean;
  customPriceAlertConfidence: string;
  currency: string;
  corporateActions: any[];
  postMarketTime: string;
  regularMarketTime: string;
  exchange: string;
  messageBoardId: string;
  exchangeTimezoneName: string;
  exchangeTimezoneShortName: string;
  gmtOffSetMilliseconds: number;
  market: string;
  esgPopulated: boolean;
  marketState: string;
  hasPrePostMarketData: boolean;
  firstTradeDateMilliseconds: string;
  priceHint: number;
  postMarketChangePercent: number;
  postMarketPrice: number;
  postMarketChange: number;
  regularMarketChange: number;
  regularMarketDayHigh: number;
  regularMarketDayRange: {
    low: number;
    high: number;
  };
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  fullExchangeName: string;
  financialCurrency: string;
}
