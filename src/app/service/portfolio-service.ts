import { Injectable, signal } from '@angular/core';
import { v4 as uuid } from 'uuid';
import portfoliosSourceData from '../../data/assets-portfolio.json';
import { Currency, CurrencyType } from '../model/domain.model';
import { getMarketPlaceCode } from './quote.service';
import { AllocationDataType, PortfolioDataType } from '../model/portfolio.model';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  readonly portfolios = signal<Record<string, PortfolioDataType>>({});

  constructor() {
    this.initialize();
  }

  private loadDatasource() {
    return Object.values(portfoliosSourceData.data).reduce((portfoliosRec, portfolioEntry) => {
      portfoliosRec[portfolioEntry.id] = this.loadPortfolioDataEntry(portfolioEntry);
      return portfoliosRec;
    }, {} as Record<string, PortfolioDataType>)
  }

  private loadPortfolioDataEntry(portfolioEntry: { id: string; name: string; currency: string; allocations: { code: string; quantity: number; marketPlace: string; marketValue: number; performance: number; percAllocation: number; percPlanned: number; }[]; }): PortfolioDataType {
    return {
      ...portfolioEntry,
      currency: Currency[portfolioEntry.currency as CurrencyType],
      allocations: portfolioEntry.allocations.reduce((assets, item) => {
        assets[getMarketPlaceCode(item)] = {
          ... item,
          initialValue: item.marketValue,
          averageBuy: 100 * Math.trunc(0.01 * item.marketValue / item.quantity)
        };
        return assets;
      }, {} as Record<string, AllocationDataType>)
    };
  }

  initialize() {
    this.portfolios.set(this.loadDatasource());
  }

  getPortfolioById(id: string) {
    return this.portfolios()[id];
  }

  getAllPortfolios() {
    return this.portfolios();
  }

  getPortfolioAllocations(portfolio: PortfolioDataType) {
    return Object.values(portfolio.allocations);
  }

  getPortfolioByAsset({marketPlace, code}: {marketPlace: string, code: string}) {
    const ticker = getMarketPlaceCode({marketPlace, code});
    return Object.values(this.portfolios())
      .filter(portfolio => Object.keys(portfolio.allocations).includes(ticker));
  }

  addPortfolio(name: string, currency: CurrencyType) {
    const newPortfolio: PortfolioDataType = {
      id: uuid(),
      name,
      currency: Currency[currency],
      allocations: {}
    };
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

  updatePortfolio(portfolioId: string, changes: Partial<PortfolioDataType>) {
    this.portfolios.update((portfolios) => ({
     ...portfolios,
      [portfolioId]: {...portfolios[portfolioId],...changes }
    }));
  }
  
}
