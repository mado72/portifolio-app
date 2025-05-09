import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Ticker } from '../model/source.model';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Currency } from '../model/domain.model';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';

export type CryptoQuoteItemResponse = {
  high: string;
  low: string;
  vol: string;
  last: string;
  buy: string;
  sell: string;
  open: string;
  date: number;
  pair: string;
  currency: Currency;
}

@Injectable({
  providedIn: 'root'
})
export class CryptoService implements IRemoteQuote {

  private http = inject(HttpClient);

  constructor() { }
  price(tickers: string[]): Observable<Record<string, QuoteResponse>> {
    tickers = tickers.map(ticker => ticker.replace('CRYPTO:', '').toLocaleUpperCase());
    const url = `${environment.apiBaseUrl}/crypto/quotes`;

    const params = new HttpParams().set('cryptos', tickers.join(','));

    return this.http.get<{ [crypto: string]: CryptoQuoteItemResponse }>(url, { params }).pipe(
      map((response) => {
        return Object.entries(response).reduce((acc, [ticker, itemResponse]) => {
          acc[`CRYPTO:${ticker}`] = {
            ...itemResponse,
            ticker: `CRYPTO:${ticker}`,
            currency: itemResponse.currency,
            name: ticker,
            symbol: ticker,
            lastUpdate: new Date(itemResponse.date),
            price: parseFloat(itemResponse.last),
            open: parseFloat(itemResponse.open),
            high: parseFloat(itemResponse.high),
            low: parseFloat(itemResponse.low),
            vol: parseFloat(itemResponse.vol),
            buy: parseFloat(itemResponse.buy),
            sell: parseFloat(itemResponse.sell),
            volume: parseFloat(itemResponse.vol),
          } as QuoteResponse;
          return acc;
        }, {} as Record<string, QuoteResponse>);
      })
    );
  }
}
