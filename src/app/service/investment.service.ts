import { computed, inject, Injectable, signal } from '@angular/core';
import { formatISO, getYear, setDayOfYear, setYear } from 'date-fns';
import { delay, forkJoin, map, Observable, of, tap } from 'rxjs';
import portfoliosSourceData from '../../data/assets-portfolio.json';
import assetSource from '../../data/assets.json';
import earningsSource from '../../data/earnings.json';
import { Currency } from '../model/domain.model';
import { Asset, AssetAllocationRecord, AssetEnum, fnTrend, Income, IncomeEnum, TrendType } from '../model/investment.model';
import { AssetPositionRecord, Portfolio, PortfolioAssetsSummary } from '../model/portfolio.model';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { v4 as uuid } from 'uuid';

type PortfolioSourceDataType = {
  [key: string]: {
    id: string;
    name: string;
    currency: Currency;
    assets: {
      marketPlace: string;
      code: string;
      quantity: number;
      marketValue: number;
      percPlanned: number;
      performance?: number;
      percAllocation?: number;
    }[];
  }
};

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  private quoteService = inject(QuoteService);

  private static earningsId = 0;

  private assertsDataSignal = signal(assetSource.data.slice());

  private earningsData = earningsSource.data.map(item => ({
    ...item,
    id: ++InvestmentService.earningsId,
    date: setDayOfYear(new Date(), Math.random() * 365),
  } as Income));

  assertsSignal = computed(() => {
    const quotes = this.quoteService.quotes();

    return this.assertsDataSignal().reduce((acc, data) => {
      const code = getMarketPlaceCode({ marketPlace: data.marketPlace, code: data.code });
      const initialQuote = acc[code]?.initialQuote || quotes[code].quote.amount;
      const trend = fnTrend(quotes[code]);

      const aux = { ...data }

      acc[code] = {
        ...data,
        type: AssetEnum[data.type as keyof typeof AssetEnum],
        lastUpdate: quotes[code].lastUpdate,
        quote: quotes[code].quote,
        initialQuote,
        trend
      };
      return acc;
    }, {} as Record<string, Asset & { trend: TrendType }>)
  })

  private portfolioSource = signal<PortfolioSourceDataType>({});

  private portfolioObservable = toObservable(this.portfolioSource);

  constructor() { 
    this.portfolioSource.set(portfoliosSourceData.data as PortfolioSourceDataType);
    this.portfolioObservable.subscribe(data=>{
      console.log(`PortfolioObservable called`, data)
    })
  }

  // FIXME: Replace this with queries
  getAllDataMock() {
    const portfolioData = this.portfolioSource();
    return forkJoin({
      exchanges: this.quoteService.getAllExchanges()
    }).pipe(
      map(({ exchanges }) => {
        const assetsRec = this.assertsSignal();
        const fnMap = (from: Currency, to: Currency) => `${from}-${to}`;

        const exchangeMap = new Map(exchanges.map(exchange => ([fnMap(exchange.from, exchange.to), exchange.factor])));

        return Object.values(portfolioData).map(portfolioItem => {
          const assets = portfolioItem.assets
            .map(allocation => {
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
            .reduce((acc, item) => {
              acc[getMarketPlaceCode({ marketPlace: item.marketPlace, code: item.code })] = item;
              return acc;
            }, {} as AssetAllocationRecord)

          const portfolio = new Portfolio(portfolioItem.id, portfolioItem.name, portfolioItem.currency, this.quoteService.quotes);
          const positions = Object.entries(assets)
            .reduce((acc, [key, value]) => {
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

  getPortfolioSummary(): Observable<{ id: string, name: string, currency: Currency }[]> {
    // FIXME: Replace this with code to query the portfolio data
    return this.portfolioObservable.pipe(
      map((portfolios) => Object.keys(portfolios).map(item => ({ id: item, name: item, currency: Currency.BRL })))
    );
  }

  getPortfolioAssetsSummary(): Observable<PortfolioAssetsSummary[]> {
    // FIXME: Replace this with code to query the portfolio data
    return this.portfolioObservable.pipe(
      map((portfolios) => Object.entries(portfolios).map(([k, v]) =>
      ({
        ...v,
        assets: v.assets.map(asset => ({
          ticker: getMarketPlaceCode(asset),
          quantity: asset.quantity
        }))
      }))
      ));
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

  getPorfoliosByAsset(asset: Asset): Observable<Portfolio[]> {
    const ticker = getMarketPlaceCode(asset);
    return this.getAllDataMock().pipe(
      map(portfolios => portfolios.filter(p => !!p.assets()[ticker]))
    );
  }

  updatePortfolioAssets({ portfolioUpdates }: { portfolioUpdates: { id: string; quantity: number; quote: number, ticker: string, date: Date, name?: string }[]; }) {

    return this.portfolioObservable.pipe(
      tap(portfolios => {
        const allAssets = this.assertsSignal();

        portfolioUpdates.forEach(updateData => {

          let portfolio = portfolios[updateData.id];
          const key = updateData.ticker;
          const asset = allAssets[key];

          if (!portfolio) {
            // create a new portfolio
            portfolio = {
              id: uuid(),
              name: updateData.name as string,
              currency: asset?.quote.currency || Currency.BRL,
              assets: []
            }
            portfolios[updateData.id] = portfolio;
          }

          const portAsset = portfolio.assets.find(asset => getMarketPlaceCode(asset) === key);
          if (portAsset) { // it had already exist in portfolio

            // remove the asset from portfolio
            portfolio.assets = portfolio.assets.filter(item => portAsset === item);

            // add the asset back to portfolio with updated quantity
            if (updateData.quantity > 0) {
              portfolio.assets = portfolio.assets.filter(item => portAsset === item)
              portfolio.assets.push({
                ...portAsset,
                quantity: updateData.quantity,
                marketValue: updateData.quantity * updateData.quote,
              })
            }
          }
          else if (updateData.quantity > 0){
            const [marketPlace, code] = key.split(':');
            portfolio.assets.push({
              marketPlace,
              code,
              quantity: updateData.quantity,
              marketValue: updateData.quantity * updateData.quote,
              percPlanned: 0
            });
          }
        });

        // Update the portfolio data
        this.portfolioSource.set(portfolios);

      }));
  }

  getAssetsDatasourceComputed() {
    return computed(() => {
      const asserts = Object.values(this.assertsSignal());
      return asserts;
    })
  }

  addAsset(data: Asset) {
    const asset = {
      ...data,
      quote: {
        ...data.quote,
        amount: Math.random() * 200
      },
      initialQuote: 0,
      manualQuote: data.manualQuote,
      lastUpdate: formatISO(new Date()),
      trend: "unchanged"
    };
    delete (asset as any).quote;
    this.assertsDataSignal().push(asset);
  }

  updateAsset(code: string, data: Asset) {
    const quotes = this.quoteService.quotes();
    const codeChanged = code != getMarketPlaceCode(data);
    if (codeChanged) {
      const newCode = getMarketPlaceCode(data);
      quotes[newCode] = quotes[code];
      delete quotes[code];
      this.quoteService.quotes.set(quotes);
    }

    const aux = {
      ...data,
      lastUpdate: formatISO(new Date())
    };

    this.assertsDataSignal.update(assertMap => {
      const idx = assertMap.findIndex(item => getMarketPlaceCode(item) === code);
      let asset = assertMap[idx];
      asset = {
        ...asset, ...aux
      };
      assertMap[idx] = asset;
      return assertMap;
    })

  }

  deleteAsset({ marketPlace, code }: { marketPlace: string; code: string; }) {
    return this.portfolioObservable.pipe(
      map(portfolios => {
        const assetFound = Object.values(portfolios)
          .flatMap(item => item.assets)
          .find(item => item.code === code && item.marketPlace === marketPlace);
        if (assetFound) {
          throw new Error('Asset is in use.');
        }
        this.assertsDataSignal.update(data => data.filter(item => getMarketPlaceCode(item) !== getMarketPlaceCode({ marketPlace, code })));
      })
    )
  }

  findIncomesBetween(from: Date, to: Date) {
    return of(this.earningsData).pipe(
      map(earnings => earnings.map(item => ({ ...item, date: setYear(item.date, getYear(from)) }))),
      delay(250)
    );
  }

  findIncomesOfAsset({ marketPlace, code }: { marketPlace: string, code: string }) {
    return of(this.earningsData.filter(item => item.ticker === getMarketPlaceCode({ marketPlace, code })));
  }

  addIncome(ticker: string, data: { date: Date; type: IncomeEnum, amount: number; }) {
    return new Observable<Income>((observer) => {
      const reg = {
        ...data,
        ticker,
        id: ++InvestmentService.earningsId
      }
      this.earningsData.push(reg);
      observer.next(reg);
      observer.complete();
    })
  }

  updateIncome(id: number, data: { date: Date; type: IncomeEnum, amount: number; }) {
    return new Observable<void>((observer) => {
      this.earningsData = this.earningsData.map(item => item.id === id ? { ...item, ...data } : item);
      observer.next();
      observer.complete();
    });
  }

  deleteIncome(id: number) {
    return new Observable<void>((observer) => {
      this.earningsData = this.earningsData.filter(item => item.id !== id);
      observer.next();
      observer.complete();
    });
  }

}
