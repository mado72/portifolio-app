import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { Currency } from '../model/domain.model';
import { formatDateYYYYMMDD } from '../model/functions.model';
import { MarketPlaceEnum } from '../model/investment.model';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';
import { Ticker } from '../model/source.model';

const COIN_USD_CODES: Record<Currency, string> = {
  USD: '',
  BRL: 'BRLUSD=X',
  USDT: 'USDT-USD',
  EUR: 'EURUSD=X'
}

@Injectable({
  providedIn: 'root'
})
export class YahooRemoteQuotesService implements IRemoteQuote {

  private http = inject(HttpClient)

  constructor() { }

  price(tickers: string[]): Observable<Record<string, QuoteResponse>> {
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

  getYahooTicker(ticker: string) {
    const [marketPlaceCode, code] = ticker.split(':');
    const marketPlace = MarketPlaceEnum[marketPlaceCode as keyof typeof MarketPlaceEnum];
    let yahooTicker;
    switch (marketPlace) {
      case MarketPlaceEnum.BVMF:
        yahooTicker = `${code}.SA`;
        break;
      case MarketPlaceEnum.COIN:
        yahooTicker = COIN_USD_CODES[code as keyof typeof Currency];
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

  getHistorical(tickers: Ticker[], startDate: Date, endDate: Date): Observable<Record<string, ChartResultArray>> {
    const entries = tickers.map(ticker => [this.getYahooTicker(ticker), ticker] as const);
    const yahooTickers = new Map(entries)

    const startDateStr = formatDateYYYYMMDD(startDate);
    const endDateStr = formatDateYYYYMMDD(endDate);

    const params = new HttpParams().append('ticker', Array.from(yahooTickers.keys()).join(','))
    const url = `${environment.apiBaseUrl}/yahoo/historical/${startDateStr}/${endDateStr}`;
    return this.http.get<Record<string, ChartResultArray>>(url, { params }).pipe(
      map(response => {
        return Object.entries(response).reduce((acc, [yahooTicker, item]) => {
          const appTicker = yahooTickers.get(yahooTicker) as string;
          acc[appTicker] = item;
          return acc;
        }, {} as Record<string, ChartResultArray>);
      })
    )
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

export interface ChartResultObject {
  [key: string]: unknown;
  meta: ChartMeta;
  timestamp?: Array<number>;
  events?: ChartEventsObject;
  indicators: ChartIndicatorsObject;
}

export interface ChartResultArray {
  meta: ChartMeta;
  events?: ChartEventsArray;
  quotes: Array<ChartResultArrayQuote>;
}

export interface ChartResultArrayQuote {
  [key: string]: unknown;
  // date: Date;
  high: number | null;
  low: number | null;
  open: number | null;
  close: number | null;
  volume: number | null;
  adjclose?: number | null;
}

export interface ChartMeta {
  [key: string]: unknown;
  currency: string; // "USD"
  symbol: string; // "AAPL",
  exchangeName: string; // "NMS",
  instrumentType: string; // "EQUITY",
  fiftyTwoWeekHigh?: number; // 226.8
  fiftyTwoWeekLow?: number; // 223.324
  firstTradeDate: Date | null; // new Date(345479400 * 1000); null in e.g. "APS.AX"
  fullExchangeName?: string; // "NasdaqGS",
  regularMarketTime: Date; // new Date(1637355602 * 1000),
  gmtoffset: number; // -18000,
  hasPrePostMarketData?: boolean;
  timezone: string; /// "EST",
  exchangeTimezoneName: string; // "America/New_York",
  regularMarketPrice: number; // 160.55,
  chartPreviousClose?: number; // 79.75; missing in e.g. "APS.AX"
  previousClose?: number; // 1137.06
  regularMarketDayHigh?: number; // 226.8
  regularMarketDayLow?: number; // 223.324
  regularMarketVolume?: number; // 33638504
  longName?: string; // "Apple Inc.",
  shortName?: string; // "Apple Inc."
  scale?: number; // 3,
  priceHint: number; // 2,
  currentTradingPeriod: {
    [key: string]: unknown;
    pre: ChartMetaTradingPeriod;
    regular: ChartMetaTradingPeriod;
    post: ChartMetaTradingPeriod;
  };
  tradingPeriods?: ChartMetaTradingPeriods | ChartMetaTradingPeriod[][];
  dataGranularity: string; // "1d",
  range: string; // "",
  validRanges: Array<string>; // ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
}

export interface ChartMetaTradingPeriod {
  [key: string]: unknown;
  timezone: string; // "EST",
  start: Date; // new Date(1637355600 * 1000),
  end: Date; // new Date(1637370000 * 10000),
  gmtoffset: number; // -18000
}

export interface ChartMetaTradingPeriods {
  [key: string]: unknown;
  pre?: Array<Array<ChartMetaTradingPeriod>>;
  post?: Array<Array<ChartMetaTradingPeriod>>;
  regular?: Array<Array<ChartMetaTradingPeriod>>;
}

export interface ChartEventsObject {
  [key: string]: unknown;
  dividends?: ChartEventDividends;
  splits?: ChartEventSplits;
}

export interface ChartEventsArray {
  [key: string]: unknown;
  dividends?: Array<ChartEventDividend>;
  splits?: Array<ChartEventSplit>;
}

export interface ChartEventDividends {
  [key: string]: ChartEventDividend;
}

export interface ChartEventDividend {
  [key: string]: unknown;
  amount: number;
  date: Date;
}

export interface ChartEventSplits {
  [key: string]: ChartEventSplit;
}

export interface ChartEventSplit {
  [key: string]: unknown;
  date: Date; // new Date(1598880600 * 1000)
  numerator: number; // 4
  denominator: number; // 1
  splitRatio: string; // "4:1"
}

export interface ChartIndicatorsObject {
  [key: string]: unknown;
  quote: Array<ChartIndicatorQuote>;
  adjclose?: Array<ChartIndicatorAdjclose>;
}

export interface ChartIndicatorQuote {
  [key: string]: unknown;
  high: Array<number | null>;
  low: Array<number | null>;
  open: Array<number | null>;
  close: Array<number | null>;
  volume: Array<number | null>;
}

export interface ChartIndicatorAdjclose {
  [key: string]: unknown;
  adjclose?: Array<number | null>; // Missing in e.g. "APS.AX"
}

export interface ChartOptions {
  period1: Date | string | number;
  period2?: Date | string | number;
  useYfid?: boolean; // true
  interval?:
    | "1m"
    | "2m"
    | "5m"
    | "15m"
    | "30m"
    | "60m"
    | "90m"
    | "1h"
    | "1d"
    | "5d"
    | "1wk"
    | "1mo"
    | "3mo";
  includePrePost?: boolean; // true
  events?: string; // 'history',
  lang?: string; // "en-US"
  return?: "array" | "object";
}

const queryOptionsDefaults: Omit<ChartOptions, "period1"> = {
  useYfid: true,
  interval: "1d",
  includePrePost: true,
  events: "div|split|earn",
  lang: "en-US",
  return: "array",
};

export interface ChartOptionsWithReturnArray extends ChartOptions {
  return?: "array";
}
export interface ChartOptionsWithReturnObject extends ChartOptions {
  return: "object";
}
