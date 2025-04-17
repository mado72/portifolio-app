import { computed, inject, Injectable } from '@angular/core';
import { Currency, CurrencyValue, CurrencyType } from '../model/domain.model';
import { calcPosition } from '../model/portfolio.model';
import { AssetQuoteType, PortfolioAllocationRecord, PortfolioAllocationsArrayItemType, PortfolioRecord, PortfolioType, SummarizedDataType } from '../model/source.model';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { SourceService } from './source.service';
import { MatDialog } from '@angular/material/dialog';
import { PortfolioRegisterDialogComponent } from '../portfolio/portfolio-register-dialog/portfolio-register-dialog.component';
import { ExchangeStructureType } from '../model/investment.model';

export type PortfolioChangeType = {
  name?: string;
  currency?: Currency;
  allocations?: {
    ticker: string;
    percPlanned: number;
    quantity: number;
    marketValue?: number;
  }[];
};

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  processAllocations(ticker: string, quote: number, allocations: Record<string, number>) {
    Object.entries(allocations)
      .filter(([_, qty]) => qty > 0)
      .forEach(([portId, qty]) => {
        const portfolio = this.portfolios()[portId];
        if (!!portfolio) {
          const changes: PortfolioChangeType = {
            ...portfolio,
            allocations: [
              ...Object.values(portfolio.allocations),
              {
                ticker,
                percPlanned: 0,
                quantity: qty,
                marketValue: qty * quote
              }
            ]
          };
          this.updatePortfolio(portId, changes);
        }
      })
  }

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
      currency: portfolio.currency,
      percPlanned: portfolio.percPlanned
    }))
    .reduce((acc, portfolio) => {
      const currencyDefault = this.sourceService.currencyDefault();

      acc.initialValue += this.quoteService.exchange(portfolio.initialValue, portfolio.currency, currencyDefault).value;
      acc.marketValue += this.quoteService.exchange(portfolio.marketValue, portfolio.currency, currencyDefault).value;
      acc.profit += this.quoteService.exchange(portfolio.profit, portfolio.currency, currencyDefault).value;
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
    } as Required<SummarizedDataType>))

  readonly portfolioAllocation = computed(() =>
    this.getAllPortfolios().map(portfolio => ({
      ...portfolio,
      allocations: Object.values(portfolio.allocations),
      total: {
        ...portfolio.total,
        percAllocation: this.quoteService.exchange(portfolio.total.marketValue, portfolio.currency, this.sourceService.currencyDefault()).value
          / this.total().marketValue
      },
    } as PortfolioAllocationsArrayItemType)));


  constructor() { }

  getPortfolioById(id: string) {
    return this.portfolios()[id];
  }

  getAllPortfolios() {
    return Object.values(this.portfolios());
  }

  getPortfolioByAsset({ marketPlace, code }: { marketPlace: string, code: string }) {
    const ticker = getMarketPlaceCode({ marketPlace, code });
    return this.getPortfoliosByTicker(ticker);
  }

  getPortfoliosByTicker(ticker: string) {
    return Object.values(this.portfolios())
      .filter(portfolio => Object.keys(portfolio.allocations).includes(ticker));
  }

  summarizeByClass(portfolios: PortfolioType[]) {
    let total: CurrencyValue = {
      value: 0,
      currency: this.sourceService.currencyDefault()
    };
    const consolidation = Object.values(portfolios
      .map(portfolio => {
        const result = {
          ...portfolio,
          value: { ...this.quoteService.enhanceExchangeInfo(portfolio.total, portfolio.currency, ["marketValue"]).marketValue },
          percAlloc: 0
        };
        return result
      })
      .reduce((acc, portfolio) => {

        if (!acc[portfolio.class]) {
          acc[portfolio.class] = { ...portfolio }
        }
        else {
          acc[portfolio.class] = {
            ...acc[portfolio.class],
            value: {
              ...acc[portfolio.class],
              original: {
                ...acc[portfolio.class].value.original,
                value: acc[portfolio.class].value.original.value + portfolio.value.original.value
              },
              exchanged: {
                ...acc[portfolio.class].value.exchanged,
                value: acc[portfolio.class].value.exchanged.value + portfolio.value.exchanged.value
              }
            },
            percPlanned: acc[portfolio.class].percPlanned + portfolio.percPlanned
          }
        }
        total.value += portfolio.value.exchanged.value;
        return acc;
      }, {} as Record<string, {
        class: string,
        value: ExchangeStructureType,
        percPlanned: number,
        percAlloc: number
      }>))

    const items = consolidation.map(item => ({
      ...item,
      percAlloc: Number((100 * item.value.exchanged.value / total.value).toPrecision(2))
    }));

    return { items, total };
  }

  addPortfolio({ name, currency, percPlanned }: { name: string; currency: CurrencyType; percPlanned: number; }) {
    this.sourceService.addPortfolio({
      id: '',
      name,
      percPlanned,
      currency: Currency[currency],
      class: '',
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
      const quotesChanged = new Map<string, number>();

      changes.allocations?.forEach(({ ticker, percPlanned, quantity, marketValue }) => {
        const [marketPlace, code] = ticker.split(':');
        const asset = this.sourceService.assertSource()[ticker];
        const manualQuote = asset?.manualQuote && !!marketValue;


        if (updatedAllocations[ticker] && quantity === 0) {
          delete updatedAllocations[ticker];
        }
        else if (updatedAllocations[ticker]) {
          const tickerQuote = quotes[ticker];

          if (!tickerQuote) {
            throw new Error(`Quote not found: ${ticker}`);
          }

          const deltaQty = quantity - updatedAllocations[ticker].quantity;
          const currentTotalInvestment = updatedAllocations[ticker].quantity * updatedAllocations[ticker].averagePrice;
          const purchaseTotalInvestment = deltaQty * tickerQuote.quote.value;
          const newTotalInvestment = currentTotalInvestment + purchaseTotalInvestment;

          const newAveragePrice = newTotalInvestment / quantity;

          const newValue = {
            ...updatedAllocations[ticker],
            marketPlace, code, percPlanned, quantity,
            initialValue: newTotalInvestment,
            averagePrice: newAveragePrice,
            marketValue: manualQuote && marketValue || updatedAllocations[ticker].marketValue
          };
          updatedAllocations[ticker] = newValue;
        }
        else {
          if (!asset) {
            throw new Error(`Asset not found: ${ticker}`);
          }
          const quote = marketValue ? { currency: asset.quote.currency, value: marketValue / quantity } : asset.quote;
          const initialValue = marketValue || asset.quote.value * quantity;
          
          updatedAllocations[ticker] = {
            ...asset,
            ticker,
            marketPlace,
            code,
            quote,
            initialValue,
            marketValue: initialValue,
            averagePrice: asset.quote.value,
            profit: 0,
            performance: 0,
            percAllocation: 0,
            percPlanned,
            quantity,
            manualQuote: !!asset.manualQuote
          };
        }

        if (manualQuote) {
          quotesChanged.set(ticker, marketValue / quantity);
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

      quotesChanged.forEach((value, ticker) => {
        const asset = this.sourceService.assertSource()[ticker];
        asset.quote.value = value;
        this.quoteService.updateQuoteAsset(asset);
      })
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
