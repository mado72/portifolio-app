import { computed, inject, Injectable } from '@angular/core';
import { Currency, CurrencyType } from '../model/domain.model';
import { calcPosition } from '../model/portfolio.model';
import { AssetQuoteType, PortfolioAllocationRecord, PortfolioAllocationsArrayItemType, PortfolioRecord, PortfolioType } from '../model/source.model';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { SourceService } from './source.service';
import { MatDialog } from '@angular/material/dialog';
import { PortfolioRegisterDialogComponent } from '../portfolio/portfolio-register-dialog/portfolio-register-dialog.component';

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

  private dialog = inject(MatDialog);

  private quoteService = inject(QuoteService);

  readonly portfolios = computed(() => Object.entries(this.sourceService.portfolioSource()).reduce((acc, [key, source]) => {
    acc[key] = {
      ...source,
      ...calcPosition(this.quoteService.quotes() || {}, source.allocations)
    }
    return acc;
  }, {} as PortfolioRecord))

  readonly total = computed(() => this.getAllPortfolios()
    .map(portfolio => ({
      ...portfolio.total,
      percPlanned: portfolio.percPlanned
    }))
    .reduce((acc, portfolio) => {
      acc.initialValue += portfolio.initialValue;
      acc.marketValue += portfolio.marketValue;
      acc.profit += portfolio.profit;
      acc.performance += portfolio.performance;
      acc.percAllocation += portfolio.percAllocation;
      acc.percPlanned += portfolio.percPlanned;
      return acc;
    }, {
      initialValue: 0,
      marketValue: 0,
      profit: 0,
      performance: 0,
      percAllocation: 0,
      percPlanned: 0
    }))

  readonly portfolioAllocation = computed(() =>
    this.getAllPortfolios().map(portfolio => ({
      ...portfolio,
      allocations: Object.values(portfolio.allocations),
      total: {
        ...portfolio.total,
        percAllocation: portfolio.total.marketValue / this.total().marketValue
      },
    } as PortfolioAllocationsArrayItemType)));


  constructor() { }

  getPortfolioById(id: string) {
    return this.portfolios()[id];
  }

  getAllPortfolios() {
    return Object.values(this.portfolios());
  }

  // getPortfolioAllocations(portfolio: PortfolioDataType) {
  //   return Object.values(portfolio.allocations);
  // }

  getPortfolioByAsset({ marketPlace, code }: { marketPlace: string, code: string }) {
    const ticker = getMarketPlaceCode({ marketPlace, code });
    return this.getPortfoliosByTicker(ticker);
  }

  getPortfoliosByTicker(ticker: string) {
    return Object.values(this.portfolios())
      .filter(portfolio => Object.keys(portfolio.allocations).includes(ticker));
  }

  addPortfolio({ name, currency, percPlanned }: { name: string; currency: CurrencyType; percPlanned: number; }) {
    this.sourceService.addPortfolio({
      id: '',
      name,
      percPlanned,
      currency: Currency[currency],
      allocations: {},
      total: {
        initialValue: 0,
        marketValue: 0,
        percPlanned: 0,
        percAllocation: 0,
        profit: 0,
        performance: 0
      }
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

      changes.allocations?.forEach(({ ticker, percPlanned, quantity }) => {
        const [marketPlace, code] = ticker.split(':');
        if (updatedAllocations[ticker]) {
          const tickerQuote = quotes[ticker];

          if (!tickerQuote) {
            throw new Error(`Quote not found: ${ticker}`);
          }

          const deltaQty = quantity - updatedAllocations[ticker].quantity;
          const currentTotalInvestment = updatedAllocations[ticker].quantity * updatedAllocations[ticker].averagePrice;
          const purchaseTotalInvestment = deltaQty * tickerQuote.quote.price;
          const newTotalInvestment = currentTotalInvestment + purchaseTotalInvestment;

          const newAveragePrice = newTotalInvestment / quantity;

          const newValue = {
            ...updatedAllocations[ticker], marketPlace, code, percPlanned, quantity,
            initialValue: newTotalInvestment,
            averagePrice: newAveragePrice
          };
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
            initialValue: asset.quote.price * quantity,
            marketValue: asset.quote.price * quantity,
            averagePrice: asset.quote.price,
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
        ...changes,
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

  openPortfolioDialog({ title, portfolioInfo }: { title: string; portfolioInfo: string | { id?: string; name: string, currency: Currency, percPlanned: number } }) {
    let portfolio: PortfolioType;
    if (typeof portfolioInfo === 'string') {
      portfolio = this.getPortfolioById(portfolioInfo as string);
    }
    else {
      portfolio = {
        ...portfolioInfo,
        allocations: {},
        total: {}
      } as PortfolioType;
    }

    const dialogRef = this.dialog.open(PortfolioRegisterDialogComponent, {
      data: {
        title,
        portfolio
      },
      width: '500px',
    });
    dialogRef.afterClosed().subscribe((result: PortfolioType) => {
      if (result) {
        if (!portfolio.id) {
          this.addPortfolio({ ...result });
        } else {
          this.updatePortfolio(portfolio.id, {
            ...result,
            allocations: result.allocations && Object.values(result.allocations).map(allocation => ({
              ticker: allocation.ticker,
              percPlanned: allocation.percPlanned,
              quantity: allocation.quantity
            }))
          });
        }
      }
    });
    return dialogRef;
  }

  portfoliosOfAsset(asset: AssetQuoteType): PortfolioType[] {
    return this.getAllPortfolios()
      .filter(portfolio => portfolio.allocations[getMarketPlaceCode(asset)]?.quantity > 0)
  }

}
