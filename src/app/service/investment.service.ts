import { computed, inject, Injectable, signal } from '@angular/core';
import { formatISO, getYear, setDayOfYear, setYear } from 'date-fns';
import { concatAll, delay, map, Observable, of, tap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import assetSource from '../../data/assets.json';
import earningsSource from '../../data/earnings.json';
import { Currency, CurrencyType } from '../model/domain.model';
import { Asset, AssetAllocationRecord, AssetEnum, fnTrend, Income, IncomeEnum, TrendType } from '../model/investment.model';
import { AllocationDataType, AllocationQuotedDataType, Portfolio, PortfolioAssetsSummary } from '../model/portfolio.model';
import { PortfolioService } from './portfolio-service';
import { getMarketPlaceCode, QuoteService } from './quote.service';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  private quoteService = inject(QuoteService);

  private portfolioService = inject(PortfolioService);

  private static earningsId = 0;

  private assertsDataSignal = signal(assetSource.data.slice());

  private earningsData = earningsSource.data.map(item => ({
    ...item,
    id: ++InvestmentService.earningsId,
    date: setDayOfYear(new Date(), Math.random() * 365),
  } as Income));

  readonly assertsSignal = computed(() => {
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
    }, {} as Record<string, Asset & { trend: TrendType }>)
  })

  readonly portfolios = computed(() => {

  });

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
    return of().pipe(
      tap(() => {

        this.portfolioService.portfolios.update(portfolios => {
          Object.values(portfolios).forEach(portfolio=>{
            portfolio.allocations.update(allocations => {
              delete allocations[getMarketPlaceCode({ marketPlace, code })];
              return allocations;
            });
          });
          return portfolios;
        });

        this.quoteService.quotes.update(quotes=> {
          delete quotes[getMarketPlaceCode({ marketPlace, code })];
          return quotes;
        });

      }),
      delay(250)
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
