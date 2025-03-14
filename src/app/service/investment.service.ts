import { computed, inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable, of } from 'rxjs';
import portfoliosSource from '../../data/assets-portfolio.json';
import assetSource from '../../data/assets.json';
import { Currency } from '../model/domain.model';
import { Asset, AssetAllocationRecord, AssetEnum, fnTrend, TrendType } from '../model/investment.model';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { AssetPosition, AssetPositionRecord, Portfolio } from '../model/portfolio.model';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  private quoteService = inject(QuoteService);

  assertsSignal = computed(() => {
    const quotes = this.quoteService.quotes();

    return assetSource.data.reduce((acc, data) => {
      const code = getMarketPlaceCode({ marketPlace: data.marketPlace, code: data.code });
      const initialQuote = acc[code]?.initialQuote || quotes[code].quote.amount;
      const trend = fnTrend(quotes[code]);
      acc[code] = {
        ...data,
        type: AssetEnum[data.type as keyof typeof AssetEnum],
        lastUpdate: quotes[code].lastUpdate,
        quote: quotes[code].quote,
        initialQuote,
        trend
      };
      return acc;
    }, {} as Record<string, Asset & {trend: TrendType}>)
  })

  assertsObservable = toObservable(this.assertsSignal);

  constructor() {}

  private getPortfolios() {
    return of(portfoliosSource.data as {
      [key: string]: {
        id: string;
        name: string;
        currency: Currency;
        assets: {
          code: string;
          quantity: number;
          marketPlace: string;
          marketValue: number;
          performance: number;
          percAllocation: number;
          percPlanned: number;
        }[];
      }
    });
  }


  // FIXME: Replace this with queries
  getAllDataMock() {
    return forkJoin({
      portfolioData: this.getPortfolios(),
      exchanges: this.quoteService.getAllExchanges()
    }).pipe(
      map(({ portfolioData, exchanges }) => {
        const assetsRec = this.assertsSignal();
        const fnMap = (from: Currency, to: Currency ) => `${from}-${to}`;

        const exchangeMap = new Map(exchanges.map(exchange=> ([fnMap(exchange.from, exchange.to), exchange.factor])));

        return Object.values(portfolioData).map(portfolioItem=>{
          const assets = portfolioItem.assets
            .map(allocation=>{
              const asset = assetsRec[getMarketPlaceCode({ marketPlace: allocation.marketPlace, code: allocation.code })];
              if (!asset) {
                return undefined;
              }
              const factor = exchangeMap.get(fnMap(asset.quote.currency, portfolioItem.currency))
              const marketValue = (factor ? factor : 1) * asset.quote.amount * allocation.quantity;
              return ({
                ...allocation,
                ...asset,
                marketValue,
                initialValue: marketValue,
                averageBuy: asset.quote.amount // FIXME: It should be gotten from datasource.
              })
            })
            .filter(item => !!item)
            .reduce((acc, item)=>{
              acc[getMarketPlaceCode({ marketPlace: item.marketPlace, code: item.code })] = item;
              return acc;
            }, {} as AssetAllocationRecord)

          const portfolio = new Portfolio(portfolioItem.id, portfolioItem.name, portfolioItem.currency, this.quoteService.quotes);
          const positions = Object.entries(assets)
            .reduce((acc, [key,value])=> {
              acc[key] = {
                ...value,
                averageBuy: value.averageBuy || value.quote.amount,
                quantity: value.quantity
              };
              return acc;
            }, {} as AssetPositionRecord);

          portfolio.assets.set(positions);
          return portfolio
        });
      })
    )
  }

  getPortfolioNames(): Observable<{id: string, name: string, currency: Currency}[]> {
    // FIXME: Replace this with code to query the portfolio data
    return this.getPortfolios().pipe(
      map((portfolios) => Object.keys(portfolios).map(item=>({id: item, name: item, currency: Currency.BRL})) )
    );
  }

  getPortfolio(id: string): Observable<Portfolio | undefined> {
    return this.getAllDataMock().pipe(
      map(portfolios => portfolios.find(p => p.id === id))
    );
  }

  getPortfolioAllocations(portfolio: Portfolio): Observable<AssetAllocationRecord> {
    return this.getAllDataMock().pipe(
      map(portfolios => portfolios.find(p => p.id === portfolio.id)?.assets || {})
    );
  }

  getAssetsDatasourceComputed() {
    return computed(()=> {
      const asserts = Object.values(this.assertsSignal());
      return asserts;
    })
  }

}
