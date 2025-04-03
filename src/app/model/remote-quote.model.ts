import { Observable } from "rxjs";
import { Currency } from "./domain.model";

export type QuoteResponse = {
  ticker: string,
  name: string,
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


export interface IRemoteQuote {

    price(tickers: string[]) : Observable<Record<string, QuoteResponse>>;
    
}
