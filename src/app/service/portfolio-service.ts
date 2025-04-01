import { computed, inject, Injectable } from '@angular/core';
import { Currency, CurrencyType } from '../model/domain.model';
import { calcPosition } from '../model/portfolio.model';
import { PortfolioAllocationRecord, PortfolioRecord } from '../model/source.model';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { SourceService } from './source.service';

export type PortfolioChangeType = {
  name?: string;
  currency?: Currency;
  allocations?: {
    ticker: string;
    percPlanned: number;
    quantity: number;
  }[];
};

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  private sourceService = inject(SourceService);

  private quoteService = inject(QuoteService);

  readonly portfolios = computed(()=> Object.entries(this.sourceService.portfolioSource()).reduce((acc, [key, source]) => {
    acc[key] = {
      ...source,
      allocations: calcPosition(this.quoteService.quotes() || {}, source.allocations)
    }
    return acc;
  }, {} as PortfolioRecord))
  
  constructor() {}

  getPortfolioById(id: string) {
    return this.portfolios()[id];
  }

  getAllPortfolios() {
    return Object.values(this.portfolios());
  }

  // getPortfolioAllocations(portfolio: PortfolioDataType) {
  //   return Object.values(portfolio.allocations);
  // }

  getPortfolioByAsset({marketPlace, code}: {marketPlace: string, code: string}) {
    const ticker = getMarketPlaceCode({marketPlace, code});
    return this.getPortfoliosByTicker(ticker);
  }

  getPortfoliosByTicker(ticker: string) {
    return Object.values(this.portfolios())
      .filter(portfolio => Object.keys(portfolio.allocations).includes(ticker));
  }

  addPortfolio(name: string, currency: CurrencyType) {
    this.sourceService.addPortfolio({
      id: '',
      name,
      currency: Currency[currency],
      allocations: {}
    })
  }

  removePortfolio(portfolioId: string) {
    this.sourceService.deletePortfolio(portfolioId);
  }

  updatePortfolio(portfolioId: string, changes: PortfolioChangeType) {
    const portfolio = this.portfolios()[portfolioId];
    if (!portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    if (changes.name && changes.name !== portfolio.name) portfolio.name = changes.name;
    if (changes.currency && changes.currency !== portfolio.currency) portfolio.currency = Currency[changes.currency];

    // FIXME: Adicionar venda e recálculo do valor dividido.
    if (changes.allocations) {
      // Update allocations
      const updatedAllocations = portfolio.allocations;
      const quotes = this.quoteService.quotes() || {};

      changes.allocations?.forEach(({ticker, percPlanned, quantity}) => {
        const [marketPlace, code] = ticker.split(':');
        if (updatedAllocations[ticker]) {
          const tickerQuote = quotes[ticker];

          if (!tickerQuote) {
            throw new Error(`Quote not found: ${ticker}`);
          }

          const deltaQty = quantity - updatedAllocations[ticker].quantity;
          const currentTotalInvestment = updatedAllocations[ticker].quantity * updatedAllocations[ticker].averagePrice;
          const purchaseTotalInvestment = deltaQty * tickerQuote.quote.amount;
          const newTotalInvestment = currentTotalInvestment + purchaseTotalInvestment;

          const newAveragePrice = newTotalInvestment / quantity;

          const newValue = { ...updatedAllocations[ticker], marketPlace, code, percPlanned, quantity, 
            initialValue: newTotalInvestment,
            averagePrice: newAveragePrice };
          updatedAllocations[ticker] = newValue;
        }
        else {
          const asset = this.sourceService.assertSource()[ticker];
          if (!asset) {
            throw new Error(`Asset not found: ${ticker}`);
          }
          updatedAllocations[ticker] = {
            ticker,
            marketPlace,
            code,
            quote: asset.quote,
            initialValue: asset.quote.amount * quantity,
            marketValue: asset.quote.amount * quantity,
            averagePrice: asset.quote.amount,
            profit: 0,
            performance: 0,
            percAllocation: 0,
            percPlanned,
            quantity,
          };
        }
      });

      this.sourceService.updatePortfolio([{
        ...portfolio,
        allocations: Object.entries(updatedAllocations).reduce((acc, [ticker, item]) => {
          acc[ticker] = {
            ...item,
            ticker,
            performance: item.marketValue - item.initialValue
          }
          return acc;
        }, {} as PortfolioAllocationRecord),
      }]);
    }
  }
  
}
