import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable, of } from 'rxjs';
import portfoliosSource from '../../data/assets-portfolio.json';
import assetSource from '../../data/assets.json';
import earningsSource from '../../data/earnings.json';
import { Currency } from '../model/domain.model';
import { Asset, AssetAllocationRecord, AssetEnum, AssetFormModel, Earning, EarningsEnum, fnTrend, TrendType } from '../model/investment.model';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { AssetPosition, AssetPositionRecord, Portfolio } from '../model/portfolio.model';
import { addDays, differenceInDays, formatISO, parseISO } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  private quoteService = inject(QuoteService);

  private static earningsId = 4;

  private assertsDataSignal = signal(assetSource.data.slice());

  private earningsData = earningsSource.data.map(item=>{
    return {
      ...item,
      date: parseISO(item.date),
    } as Earning
  });

  assertsSignal = computed(() => {
    const quotes = this.quoteService.quotes();

    return this.assertsDataSignal().reduce((acc, data) => {
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

  addAsset(data: AssetFormModel) {
    const asset = {
      ...data,
      price: Math.random() * 200 + 10,
      initialQuote: 0,
      manualQuote: data.manualQuote,
      lastUpdate:  formatISO(new Date()),
      trend: "unchanged"
    }
    this.assertsDataSignal().push(asset);
  }

  updateAsset(code: string, data: AssetFormModel) {
    const quotes = this.quoteService.quotes();
    const changedCode = code != getMarketPlaceCode(data);
    if (changedCode) {
      const newCode = getMarketPlaceCode(data);
      quotes[newCode] = quotes[code];
    }
    this.quoteService.quotes.set(quotes);

    this.assertsDataSignal.update(assertMap => {
      const idx = assertMap.findIndex(item => getMarketPlaceCode(item) === code);
      let asset = assertMap[idx];
      asset = {... asset, ...data,
        price: Math.random() * 200 + 10,
        lastUpdate:  formatISO(new Date())
      };
      assertMap[idx] = asset;
      return assertMap;
    })

    this.quoteService.quotes.update(quotes=>{
      delete quotes[code];
      return quotes;
    });

  }

  deleteAsset({ marketPlace, code }: { marketPlace: string; code: string; }) {
    return this.getPortfolios().pipe(
      map(portfolios=>{
        const assetFound = Object.values(portfolios)
          .flatMap(item=>item.assets)
          .find(item=>item.code === code && item.marketPlace === marketPlace);
        if (assetFound) {
          throw new Error('Asset is in use.');
        }
        this.assertsDataSignal.update(data => data.filter(item => getMarketPlaceCode(item) !== getMarketPlaceCode({marketPlace, code})));
      })
    )
  }

  findEarningsBetween(from: Date, to: Date) {
    return of(this.earningsData).pipe(
      map(earnings => earnings.map(item=>({...item, date: addDays(from, Math.random() * differenceInDays(to, from))}))
    ));
  }

  findEarningsOfAsset({marketPlace, code}: {marketPlace: string, code: string}) {
    return of(this.earningsData.filter(item=>item.ticket === getMarketPlaceCode({marketPlace, code})));
  }

  addEarning(data: { date: Date; ticket: string; type: EarningsEnum, amount: number; }) {
    const reg = {
      ...data,
      id: InvestmentService.earningsId++
    }
    this.earningsData.push(reg);
  }

  updateEarning(id: number, data: { date: Date; ticket: string; type: EarningsEnum, amount: number; }) {
    this.earningsData = this.earningsData.map(item=>item.id === id ? {...item, ...data} : item);
  }

  deleteEarning(id: number) {
    this.earningsData = this.earningsData.filter(item=>item.id !== id);
  }

}
