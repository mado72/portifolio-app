import { inject, Injectable, signal } from '@angular/core';
import { v4 as uuid } from 'uuid';
import portfoliosSourceData from '../../data/assets-portfolio.json';
import assetSource from '../../data/assets.json';
import { Currency, CurrencyType } from '../model/domain.model';
import { divide } from '../model/functions.model';
import { Portfolio, PortfolioDataType } from '../model/portfolio.model';
import { getMarketPlaceCode, QuoteService } from './quote.service';

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

  private quoteService = inject(QuoteService);

  private assertsDataSignal = signal(assetSource.data.slice());

  readonly portfolios = signal<Record<string, Portfolio>>({});

  constructor() {
    this.initialize();
  }

  private loadDatasource() {
    return Object.values(portfoliosSourceData.data).reduce((portfoliosRec, portfolioEntry) => {
      portfoliosRec[portfolioEntry.id] = this.loadPortfolioDataEntry(portfolioEntry);
      return portfoliosRec;
    }, {} as Record<string, Portfolio>)
  }

  private loadPortfolioDataEntry(
      portfolioEntry: { id: string; name: string; currency: string; 
        allocations: { code: string; quantity: number; marketPlace: string; marketValue: number; performance: number; percAllocation: number; percPlanned: number; }[]; }): Portfolio {

    return new Portfolio({
      id: portfolioEntry.id,
      name: portfolioEntry.name,
      currency: Currency[portfolioEntry.currency as CurrencyType],
      allocations: portfolioEntry.allocations.map(entry => ({
        ...entry,
        initialValue: entry.marketValue,
        averagePrice: divide(entry.marketValue, entry.quantity)
      })),
      quotes: this.quoteService.quotes,
      exchanges: this.quoteService.exchanges()
    });
  }

  initialize() {
    this.portfolios.set(this.loadDatasource());
  }

  getPortfolioById(id: string) {
    return this.portfolios()[id];
  }

  getAllPortfolios() {
    return Object.values(this.portfolios());
  }

  getPortfolioAllocations(portfolio: PortfolioDataType) {
    return Object.values(portfolio.allocations);
  }

  getPortfolioByAsset({marketPlace, code}: {marketPlace: string, code: string}) {
    const ticker = getMarketPlaceCode({marketPlace, code});
    return this.getPortfoliosByTicker(ticker);
  }

  getPortfoliosByTicker(ticker: string) {
    return Object.values(this.portfolios())
      .filter(portfolio => Object.keys(portfolio.allocations).includes(ticker));
  }

  addPortfolio(name: string, currency: CurrencyType) {
    const newPortfolio = new Portfolio({
      id: uuid(),
      name,
      currency: Currency[currency],
      allocations: [],
      exchanges: this.quoteService.exchanges(),
      quotes: this.quoteService.quotes
    });
    this.portfolios.update((portfolios) => ({
      ... portfolios,
      [newPortfolio.id]: newPortfolio
    }));
  }

  removePortfolio(portfolioId: string) {
    this.portfolios.update((portfolios) => {
      const { [portfolioId]: _,...rest } = portfolios;
      return rest;
    });
  }

  updatePortfolio(portfolioId: string, changes: PortfolioChangeType) {
    this.portfolios.update((portfolios)=>{
      const portfolio = portfolios[portfolioId];

      if (changes.name && changes.name !== portfolio.name) portfolio.name = changes.name;
      if (changes.currency && changes.currency !== portfolio.currency) portfolio.currency = Currency[changes.currency];

      // FIXME: Adicionar venda e recálculo do valor dividido.
      if (changes.allocations) {
        // Update allocations
        portfolio.allocations.update((allocations)=>{
          const updatedAllocations = {...allocations};
          changes.allocations?.forEach(({ticker, percPlanned, quantity}) => {
            const [marketPlace, code] = ticker.split(':');
            if (updatedAllocations[ticker]) {
              const tickerQuote = this.quoteService.quotes()[ticker];

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
              const asset = this.assertsDataSignal()?.find(asset => asset.code === code && asset.marketPlace === marketPlace);
              if (!asset) {
                throw new Error(`Asset not found: ${marketPlace}:${code}`);
              }
              updatedAllocations[ticker] = {
                marketPlace,
                code,
                initialValue: asset.quote.amount * quantity,
                marketValue: asset.quote.amount * quantity,
                averagePrice: asset.quote.amount,
                percPlanned,
                quantity,
              };
            }
          });
          return updatedAllocations;
        })
      }

      return portfolios;
    })
  }
  
}
