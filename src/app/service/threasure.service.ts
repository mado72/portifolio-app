import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CacheService } from './cache.service';
import { TreasuryBondResponse } from '../model/threasure.model';
import { map, Observable, of, tap } from 'rxjs';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';
import { Currency } from '../model/domain.model';
import { getMarketPlaceCode } from './quote.service';
import { MarketPlaceEnum } from '../model/investment.model';

@Injectable({
  providedIn: 'root'
})
export class ThreasureService implements IRemoteQuote{

  private http = inject(HttpClient);

  private cacheService = inject(CacheService);

  constructor() { }

  price(tickers: string[]): Observable<Record<string, QuoteResponse>> {
    tickers = tickers.map(ticker => ticker.replace(/.*:/g, ''));
    return this.getBondsById(tickers).pipe(
      map((response) => {
        // Iterate over the response and extract the relevant data
        const quotes = Object.values(response).reduce((acc, bondData) => {
          const bond = bondData.TrsrBd;
          const ticker = getMarketPlaceCode({ marketPlace: MarketPlaceEnum.BRTD, code: bond.isinCd });
          acc[ticker] = {
            price: bond.untrRedVal,
            lastUpdate: new Date(bond.mtrtyDt),
            ticker: bond.isinCd,
            currency: Currency.BRL,
            high: bond.untrRedVal,
            low: bond.untrRedVal,
            name: bond.nm,
            open: bond.untrRedVal,
            symbol: bond.isinCd,
            volume: NaN
          };
          return acc;
        }, {} as Record<string, QuoteResponse>);

        return quotes;
      })
    );
  }

  getAllBonds() {
    const url = `${environment.apiBaseUrl}/bonds/all`;
    const cachedResponse = this.cacheService.get<TreasuryBondResponse>(url);
    if (cachedResponse) {
      return of(cachedResponse);
    }
    // If not in cache, make the HTTP request and cache the response
    return this.http.get<TreasuryBondResponse>(url).pipe(
      tap((response) => {
        this.cacheService.set(url, response);
      }
    ));
  }

  getBondsById(ids: string[]) {
    const params = new HttpParams().set('bonds', ids.join(','));
    const url = `${environment.apiBaseUrl}/bonds/filter`;
    const cacheKey = `${url}?${params.toString()}`;
    const cachedResponse = this.cacheService.get<TreasuryBondResponse>(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }
    // If not in cache, make the HTTP request and cache the response
    return this.http.get<TreasuryBondResponse>(url, { params }).pipe(
      tap((response) => {
        this.cacheService.set(cacheKey, response);
      })
    )
  };
}
