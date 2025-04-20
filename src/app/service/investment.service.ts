import { computed, inject, Injectable } from '@angular/core';
import { getYear, setYear } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { Income, IncomeEnum } from '../model/investment.model';
import { AssetEnum, AssetQuoteRecord, AssetQuoteType, fnTrend, IncomeType } from '../model/source.model';
import { PortfolioService } from './portfolio-service';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  private sourceService = inject(SourceService);

  private portfolioService = inject(PortfolioService);

  private quoteService = inject(QuoteService);

  private earningsData = computed(() => Object.entries(this.sourceService.incomeSource()).reduce((acc, [key, item]) => {
    return {...acc, [key]: {...item } };
  }, {} as Record<number, Income>))
  
  readonly assertsSignal = computed(() => {
    const quotes = this.quoteService.quotes() || {};

    return Object.entries(this.sourceService.assetSource()).reduce((acc, [ticker, asset]) => {
      const initialPrice = acc[ticker]?.initialPrice || quotes[ticker]?.quote.value || NaN;
      const trend = quotes[ticker] ? fnTrend(quotes[ticker]) : 'unchanged';

      acc[ticker] = {
        ...asset,
        type: AssetEnum[asset.type as keyof typeof AssetEnum],
        lastUpdate: quotes[ticker]?.lastUpdate || new Date(),
        quote: quotes[ticker]?.quote || { value: NaN, currency: this.sourceService.currencyDefault() },
        initialPrice,
        trend
      };
      return acc;
    }, {} as AssetQuoteRecord)
  })

  readonly portfolios = computed(() => {

  });

  getAssetsDatasourceComputed() {
    return computed(() => {
      const asserts = Object.values(this.assertsSignal());
      return asserts;
    })
  }

  addAsset(data: AssetQuoteType) {
    this.sourceService.addAsset(data);
  }

  updateAsset(ticker: string, data: AssetQuoteType) {
    // const quotes = this.quoteService.quotes() || {};
    // const codeChanged = ticker != getMarketPlaceCode(data);
    // if (codeChanged) {
    //   const newCode = getMarketPlaceCode(data);
    //   quotes[newCode] = quotes[ticker];
    //   delete quotes[ticker];
    //   this.quoteService.quotes.set(quotes);
    // }
    
    this.sourceService.updateAsset([data]);
  }

  deleteAsset({ marketPlace, code }: { marketPlace: string; code: string; }) {
    const ticker = getMarketPlaceCode({marketPlace, code});
    const portfoliosChanges = Object.values(this.portfolioService.portfolios())
      .filter(portfolio => 
        Object.keys(portfolio.allocations).includes(ticker))
      .map(portfolio => {
        delete portfolio.allocations[ticker];
        return portfolio;
      });
    this.sourceService.updatePortfolio(portfoliosChanges);

    // this.quoteService.quotes.update(quotes=> {
    //   delete quotes[getMarketPlaceCode({ marketPlace, code })];
    //   return quotes;
    // });

    this.sourceService.deleteAsset(ticker);
  }

  findIncomesBetween(from: Date, to: Date): Income[] {
    // FIXME: Está mockado
    return Object.values(this.earningsData())
      .map(item => ({ ...item, date: setYear(item.date, getYear(from)) }));
  }

  findIncomesOfAsset({ marketPlace, code }: { marketPlace: string, code: string }) {
    const ticker = getMarketPlaceCode({ marketPlace, code });
    return Object.values(this.earningsData())
      .filter(item => item.ticker === ticker);
  }

  addIncome(ticker: string, data: { date: Date; type: IncomeEnum, amount: number; }) {
    const reg = {
      ...data,
      ticker,
      id: uuid()
    } as IncomeType;
    this.sourceService.addIncome(reg);

    return reg;    
  }

  updateIncome(id: string, data: { date: Date; type: IncomeEnum, amount: number; }) {
    const income = this.sourceService.incomeSource()[id];
    const ticker = income.ticker;
    this.sourceService.updateIncome([{
      ...data,
      id,
      ticker
    }]);
  }

  deleteIncome(id: string) {
    this.sourceService.deleteIncome(id);
  }

}
