import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { MarketPlaceEnum } from '../model/investment.model';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';

const BATCH_SIZE = 5;
const INTERVAL_MS = 500;

@Injectable({
  providedIn: 'root'
})
export class YahooRemoteQuotesService implements IRemoteQuote {

  private http = inject(HttpClient)

  constructor() { }

  price(tickers: string[]): Observable<Record<string, QuoteResponse>> {
    // if (tickers.length === 1) {
    //   return this.priceWithMultipleRequests(tickers);
    // }
    return this.priceWithSingleRequest(tickers);
  }

  priceWithSingleRequest(tickers: string[]): Observable<Record<string, QuoteResponse>> {
    const entries = tickers.map(ticker => [this.getYahooTicker(ticker), ticker] as const);
    const yahooTickers = new Map(entries)
    return this.getQuotes(Array.from(yahooTickers.keys())).pipe(
      map(response => {
        return Object.entries(response).reduce((acc, [yahooTicker, item]) => {
          const appTicker = yahooTickers.get(yahooTicker) as string;
          acc[appTicker] = this.responseToQuoteResponse(yahooTicker, item);
          return acc;
        }, {} as Record<string, QuoteResponse>);
      })
    )
  }

  getQuotes(tickers: string[]) {
    let yahooTickers = tickers.reduce((acc, ticker) => {
      acc.push(ticker);
      return acc;
    }, [] as string[]).join(',')

    const params = new HttpParams().append('ticker', yahooTickers)
    const url = `${environment.apiBaseUrl}/yahoo/price`;
    return this.http.get<Record<string, YahooQuoteResponse>>(url, { params });
  }
  // priceWithMultipleRequests(tickers: string[]) {
  //   const requests = tickers.reduce((acc, ticker) => {
  //     acc[ticker] = this.fetchQuote(ticker);
  //     return acc;
  //   }, {} as Record<string, Observable<QuoteResponse>>);

  //   const observables = Object.values(requests);
  //   return from(observables).pipe(
  //     // Divide in groups of BATCH_SIZE requests
  //     bufferCount(BATCH_SIZE),
  //     // Executes with delay between requests
  //     concatMap((batch, batchIndex) => {
  //       const totalBatches = Math.ceil(batch.length / BATCH_SIZE);
  //       const execBatch = forkJoin(batch);

  //       const aux = ((batchIndex < totalBatches)
  //         ? execBatch.pipe(delay(INTERVAL_MS))
  //         : execBatch);
  //       return aux;
  //     }),
  //     // Combine batches into a single result
  //     zipAll(),
  //     // Map the results to a single object with quote data for each ticker
  //     map(results => {
  //       return results.reduce((acc, quote) => {
  //         acc[quote.ticker] = quote;
  //         return acc;
  //       }, {} as Record<string, QuoteResponse>);
  //     })
  //   );
  // }

  // fetchQuote(ticker: string) {
  //   return from(this.getQuote(ticker)).pipe(
  //     map((response) => {
  //       return this.responseToQuoteResponse(ticker, response)
  //     })
  //   );
  // }

  // getQuote(ticker: string) {
  //   let yahooTicker = this.getYahooTicker(ticker);
    
  //   const url = `${environment.apiBaseUrl}/yahoo/price/${yahooTicker}`;
  //   return this.http.get<YahooQuoteResponse>(url);
  // }

  getYahooTicker(ticker: string) {
    const [marketPlaceCode, code] = ticker.split(':');
    const marketPlace = MarketPlaceEnum[marketPlaceCode as keyof typeof MarketPlaceEnum];
    let yahooTicker;
    switch (marketPlace) {
      case MarketPlaceEnum.BVMF:
        yahooTicker = `${code}.SA`;
        break;
      default:
        yahooTicker = code;
    }
    return yahooTicker;
  }

  responseToQuoteResponse(ticker: string, response: YahooQuoteResponse): QuoteResponse {
    return {
      ticker,
      name: [response.shortName, response.longName].filter(v=>!!v).join(' - '),
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
    } as QuoteResponse;
  }
}

export type YahooQuoteResponse = {
  language: string; // "en-US",
  region: string; // "US",
  quoteType: string; // "EQUITY" | "ETF" | "MUTUALFUND";
  typeDisp?: string; // "Equity", not always present.
  quoteSourceName?: string; // "Delayed Quote",
  triggerable: boolean; // true,
  currency?: string; // "USD",
  // Seems to appear / disappear based not on symbol but network load (#445)
  customPriceAlertConfidence?: string; // "HIGH" | "LOW"; TODO: anything else?
  marketState: "REGULAR" | "CLOSED" | "PRE" | "PREPRE" | "POST" | "POSTPOST";
  tradeable: boolean; // false,
  cryptoTradeable?: boolean; // false
  corporateActions?: unknown[]; // [],  XXX TODO
  exchange: string; // "NMS",
  shortName?: string; // "NVIDIA Corporation",
  longName?: string; // "NVIDIA Corporation",
  messageBoardId?: string; // "finmb_32307",
  exchangeTimezoneName: string; // "America/New_York",
  exchangeTimezoneShortName: string; // "EST",
  gmtOffSetMilliseconds: number; // -18000000,
  market: string; // "us_market",
  esgPopulated: boolean; // false,
  fiftyTwoWeekLowChange?: number; // 362.96002,
  fiftyTwoWeekLowChangePercent?: number; // 2.0088556,
  fiftyTwoWeekRange?: {
    low: number; // 180.68,
    high: number; // 589.07
  }; // "180.68 - 589.07" -> { low, high }
  fiftyTwoWeekHighChange?: number; // -45.429993,
  fiftyTwoWeekHighChangePercent?: number; // -0.07712155,
  fiftyTwoWeekLow?: number; // 180.68,
  fiftyTwoWeekHigh?: number; // 589.07,
  fiftyTwoWeekChangePercent?: number; // 22.604025
  dividendDate?: Date; // 1609200000,
  // maybe always present on EQUITY?
  earningsTimestamp?: Date; // 1614200400,
  earningsTimestampStart?: Date; // 1614200400,
  earningsTimestampEnd?: Date; // 1614200400,
  earningsCallTimestampStart?: Date; // 1738274400,
  earningsCallTimestampEnd?: Date; // 1738274400,
  isEarningsDateEstimate?: boolean; // true
  trailingAnnualDividendRate?: number; // 0.64,
  trailingPE?: number; // 88.873634,
  trailingAnnualDividendYield?: number; // 0.0011709387,
  epsTrailingTwelveMonths?: number; // 6.117,
  epsForward?: number; // 11.68,
  epsCurrentYear?: number; // 9.72,
  priceEpsCurrentYear?: number; // 55.930042,
  sharesOutstanding?: number; // 619000000,
  bookValue?: number; // 24.772,
  fiftyDayAverage?: number; // 530.8828,
  fiftyDayAverageChange?: number; // 12.757202,
  fiftyDayAverageChangePercent?: number; // 0.024030166,
  twoHundredDayAverage?: number; // 515.8518,
  twoHundredDayAverageChange?: number; // 27.788208,
  twoHundredDayAverageChangePercent?: number; // 0.053868588,
  marketCap?: number; // 336513171456,
  forwardPE?: number; // 46.54452,
  priceToBook?: number; // 21.945745,
  sourceInterval: number; // 15,
  exchangeDataDelayedBy: number; // 0,
  firstTradeDateMilliseconds?: number; // 917015400000 -> Date
  priceHint: number; // 2,
  postMarketChangePercent?: number; // 0.093813874,
  postMarketTime?: Date; // 1612573179 -> new Date()
  postMarketPrice?: number; // 544.15,
  postMarketChange?: number; // 0.51000977,
  hasPrePostMarketData?: boolean; // true,
  regularMarketChange?: number; // -2.9299927,
  regularMarketChangePercent?: number; // -0.53606904,
  regularMarketTime?: Date; // 1612558802 -> new Date()
  regularMarketPrice?: number; // 543.64,
  regularMarketDayHigh?: number; // 549.19,
  regularMarketDayRange?: {
    low: number; // 541.867,
    high: number; // 549.19,
  }; // "541.867 - 549.19" -> { low, high }
  regularMarketDayLow?: number; // 541.867,
  regularMarketVolume?: number; // 4228841,
  regularMarketPreviousClose?: number; // 546.57,
  preMarketChange?: number; // -2.9299927,
  preMarketChangePercent?: number; // -0.53606904,
  preMarketTime?: Date; // 1612558802 -> new Date()
  preMarketPrice?: number; // 543.64,
  bid?: number; // 543.84,
  ask?: number; // 544.15,
  bidSize?: number; // 18,
  askSize?: number; // 8,
  fullExchangeName: string; // "NasdaqGS",
  financialCurrency?: string; // "USD",
  regularMarketOpen?: number; // 549.0,
  averageDailyVolume3Month?: number; // 7475022,
  averageDailyVolume10Day?: number; // 5546385,
  displayName?: string; // "NVIDIA",
  symbol: string; // "NVDA"
  underlyingSymbol?: string; // "LD.MI" (for LDO.MI, #363)
  // only on ETF?  not on EQUITY?
  ytdReturn?: number; // 0.31
  trailingThreeMonthReturns?: number; // 16.98
  trailingThreeMonthNavReturns?: number; // 17.08
  ipoExpectedDate?: Date; // "2020-08-13",
  newListingDate?: Date; // "2021-02-16",
  nameChangeDate?: Date;
  prevName?: string;
  averageAnalystRating?: string;
  pageViewGrowthWeekly?: number; // Since 2021-11-11 (#326)
  openInterest?: number; // SOHO (#248)
  beta?: number;
}
