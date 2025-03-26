import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { formatISO, getYear, setDayOfYear, setYear } from 'date-fns';
import { concatAll, delay, map, Observable, of, tap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import portfoliosSourceData from '../../data/assets-portfolio.json';
import assetSource from '../../data/assets.json';
import earningsSource from '../../data/earnings.json';
import { Currency, CurrencyType } from '../model/domain.model';
import { Asset, AssetAllocationRecord, AssetEnum, fnTrend, Income, IncomeEnum, TrendType } from '../model/investment.model';
import { AssetPositionRecord, Portfolio, PortfolioAssetsSummary } from '../model/portfolio.model';
import { getMarketPlaceCode, QuoteService } from './quote.service';

type PortfolioSourceAssetsDataType = {
  marketPlace: string;
  code: string;
  quantity: number;
  marketValue: number;
  percPlanned: number;
  performance?: number;
  percAllocation?: number;
};

type PortfolioSourceDataType = {
  [key: string]: {
    id: string;
    name: string;
    currency: Currency;
    assets: PortfolioSourceAssetsDataType[];
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
    const portfolioArray = Object.values(this.portfolioSource());
    return this.fillAssetQuotesInPortfolios(portfolioArray)
  }


  protected fillAssetQuotesInPortfolios(portfolioArray: { id: string; name: string; currency: Currency; assets: PortfolioSourceAssetsDataType[]; }[]) {
    return this.quoteService.getAllExchangesMap().pipe(
      map(exchanges => {
        const assetsRec = this.assertsSignal();

        return portfolioArray.map(portfolioItem => {

          return this.buildPorfolioAssets(portfolioItem, assetsRec, exchanges);
        });
      })
    );
  }

  private buildPorfolioAssets(
      portfolioItem: { id: string; name: string; currency: Currency; assets: PortfolioSourceAssetsDataType[]; }, 
      assetsRec: Record<string, Asset>, 
      exchanges: Record<CurrencyType, Record<CurrencyType, number>>) {

    const allocations = portfolioItem.assets
      .map(allocation => {
         // Fetch asset data from the assets record by marketPlace code
        const asset = assetsRec[getMarketPlaceCode(allocation)];
        if (!asset) {
          return undefined;
        }
        const from = asset.quote.currency;
        const to = portfolioItem.currency;
        // Calculate market value using the exchange rate between asset's currency and portfolio's currency.
        const factor = exchanges[from][to] || NaN;
        const marketValue = factor * asset.quote.amount * allocation.quantity;

        // Calculate performance based on the asset's market value and the asset's initial value.
        return ({
          ...allocation,
          ...asset,
          marketValue,
          initialValue: marketValue,// FIXME: It should be gotten from datasource.
          averageBuy: asset.quote.amount, 
          performance: 0 // FIXME: It should calculate based on initial value
        });
      })
      .filter(item => !!item)
      .reduce((acc, item) => {
        acc[getMarketPlaceCode({ marketPlace: item.marketPlace, code: item.code })] = item;
        return acc;
      }, {} as AssetAllocationRecord);

    const portfolio = new Portfolio({ id: portfolioItem.id, name: portfolioItem.name, currency: portfolioItem.currency, quotes: this.quoteService.quotes });
    const positions = Object.entries(allocations)
      .reduce((acc, [key, value]) => {
        acc[key] = {
          ...value,
          averageBuy: value.averageBuy || value.quote.amount,
          quantity: value.quantity
        };
        return acc;
      }, {} as AssetPositionRecord);

    portfolio.assets.set(positions);
    return portfolio;
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
      map(portfolios => portfolios.find(p => p.id === portfolio.id)?.assets() || {})
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
            portfolios[portfolio.id] = portfolio;
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

  updatePortfolioAllocation(portfolioId: string, {ticket, quantity, percent} : {ticket: string, quantity: number, percent: number}) {
    return this.portfolioObservable.pipe(
      map(portfoliosSource => {
        const portfolioSource = portfoliosSource[portfolioId];
        if (portfolioSource) {
          const assetSource = portfolioSource.assets.find(a => getMarketPlaceCode(a) === ticket);
          if (assetSource) {
            assetSource.quantity = quantity;
            assetSource.percPlanned = percent;
          }
        }
        this.portfolioSource.set(portfoliosSource);
        return this.getAllDataMock()
      }),
      concatAll()
    )
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
