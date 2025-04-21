import { computed, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Currency, CurrencyType, CurrencyValue } from '../model/domain.model';
import { ExchangeStructureType } from '../model/investment.model';
import { AssetQuoteType, PortfolioAllocation, PortfolioAllocationsArrayItemType, PortfolioRecord, PortfolioType, SummarizedDataType } from '../model/source.model';
import { PortfolioRegisterDialogComponent } from '../portfolio/portfolio-register-dialog/portfolio-register-dialog.component';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { SourceService } from './source.service';

const INITIAL_TOTAL = {
  initialValue: 0,
  marketValue: 0,
  percPlanned: 0,
  profit: 0,
  performance: 0
} as Required<SummarizedDataType>;

export type PortfolioAllocationChangeType = {
  ticker: string;
  percPlanned: number;
  marketValue?: number;
}

export type PortfolioChangeType = {
  name?: string;
  percPlanned?: number;
  currency?: Currency;
  transaction?: {
    id: string;
    quantity: number;
  }
};

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  private sourceService = inject(SourceService);

  private dialog = inject(MatDialog);

  private quoteService = inject(QuoteService);

  readonly portfolios = computed<PortfolioRecord>(() => {
    const assets = this.sourceService.assetSource();
    if (!Object.keys(assets).length) {
      return {};
    }
    const quotes = this.quoteService.quotes() || {};

    const entries = Object.entries(this.sourceService.dataSource.portfolio()).reduce((acc, [key, item]) => {

      const exchangeFn = (value: number, currency: Currency) => {
        return this.quoteService.exchange(value, currency, Currency[item.currency as keyof typeof Currency]);
      }

      let allocTotal = { ...INITIAL_TOTAL }

      const allocations = item.allocations.reduce((allocAcc, allocSource) => {
        const alloc = new PortfolioAllocation({
          ...allocSource,
          percAllocation: allocSource.percAllocation || 0,
          profit: allocSource.profit || 0,
          performance: allocSource.performance || 0
        })
        const asset = assets[alloc.data.ticker];
        if (!asset) {
          console.warn(`Asset not found: ${alloc.data.ticker}`);
          alert(`Asset not found: ${alloc.data.ticker}`);
          return allocAcc;
        }
        alloc.data.marketValue = quotes[alloc.data.ticker]?.quote.value * alloc.quantity || alloc.data.marketValue;

        const transactions = (alloc.data.transactions || []).concat(
          alloc.data.transactions || []).filter((item, index, self) => {
            return index === self.findIndex((t) => t === item);
          });

        // Produces a new object with the same properties as asset[ticker] and alloc
        // and adds the total to it
        allocAcc[alloc.data.ticker] = alloc;

        allocTotal = {
          ...allocTotal,
          initialValue: (allocTotal.initialValue || 0) + exchangeFn(alloc.data.initialValue, asset.quote.currency).value,
          marketValue: (allocTotal.marketValue || 0) + exchangeFn(alloc.data.marketValue, asset.quote.currency).value,
          percPlanned: (allocTotal.percPlanned || 0) + alloc.data.percPlanned,
          profit: (allocTotal.profit || 0) + exchangeFn(alloc.data.profit || 0, asset.quote.currency).value
        }
        return allocAcc;
      }, {} as Record<string, PortfolioAllocation>);

      acc[key] = {
        ...item,
        currency: Currency[item.currency as keyof typeof Currency],
        class: item.class,
        allocations,
        total: allocTotal
      }

      return acc;
    }, {} as Record<string, PortfolioType>);

    const total = Object.values(entries).reduce((acc, portfolio) => {
      portfolio.total = Object.values(portfolio.allocations).reduce((accPort, alloc) => {
        const assetCurrency = this.sourceService.assetSource()[alloc.data.ticker]?.quote?.currency || portfolio.currency;
        this.summarize({ currency: portfolio.currency, total: accPort }, { currency: assetCurrency, total: alloc.data });
        return accPort;
      }, { ...INITIAL_TOTAL } as Required<SummarizedDataType>);

      Object.values(portfolio.allocations).forEach(alloc => {
        alloc.data.percAllocation = alloc.data.marketValue / portfolio.total.marketValue;
      });

      this.summarize({ currency: this.sourceService.currencyDefault(), total: acc }, { ...portfolio });
      return acc;
    },
      { ...INITIAL_TOTAL } as Required<SummarizedDataType>);

    Object.values(entries).forEach(portfolio => {
      portfolio.total.percAllocation = portfolio.total.marketValue / total.marketValue;
    });

    return entries
  });

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
        percAllocation: this.quoteService.exchange(
          portfolio.total.marketValue,
          portfolio.currency,
          this.sourceService.currencyDefault()).value / this.total().marketValue
      },
    } as PortfolioAllocationsArrayItemType)));

  constructor() { }

  private summarize(acc: { currency: Currency, total: Required<SummarizedDataType> }, alloc: { currency: Currency, total: Required<SummarizedDataType> }) {
    acc.total.initialValue += this.quoteService.exchange(alloc.total.initialValue, alloc.currency, acc.currency).value;
    acc.total.marketValue += this.quoteService.exchange(alloc.total.marketValue, alloc.currency, acc.currency).value;
    acc.total.profit += this.quoteService.exchange(alloc.total.profit, alloc.currency, acc.currency).value;
    acc.total.performance += this.quoteService.exchange(alloc.total.performance, alloc.currency, acc.currency).value;
    acc.total.percPlanned += this.quoteService.exchange(alloc.total.percPlanned, alloc.currency, acc.currency).value;
  }

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

  processAllocations(ticker: string, transactionId: string, quote: number, allocations: Record<string, number>) {
    Object.entries(allocations)
      .filter(([_, qty]) => qty > 0)
      .forEach(([portId, qty]) => {
        const portfolio = this.portfolios()[portId];
        if (!!portfolio) {
          const transaction = {
            id: transactionId,
            quantity: allocations[portId]
          };

          const chgAlloc: PortfolioChangeType = {
            transaction
          };

          this.updatePortfolio(portId, chgAlloc);
        }
      })
  }

  updatePortfolio(portfolioId: string, changes: PortfolioChangeType) {
    const portfolio = {...this.portfolios()[portfolioId]};
    if (!portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    if (changes.name) portfolio.name = changes.name;
    if (changes.currency) portfolio.currency = Currency[changes.currency];
    if (changes.percPlanned) portfolio.percPlanned = changes.percPlanned;

    if (!!changes.transaction) {
      const chgTransaction = changes.transaction;

      const investmentTransaction = this.sourceService.investmentSource()[chgTransaction.id];

      if (!investmentTransaction) {
        throw new Error(`Transaction ${chgTransaction.id} not found`);
      }

      const asset = this.sourceService.assetSource()[investmentTransaction.ticker];
      if (!asset) {
        throw new Error(`Asset ${investmentTransaction.ticker} not found`)
      }

      const quote = !!asset.manualQuote 
        ? { value: investmentTransaction.quote, currency: asset.quote.currency } 
        : this.quoteService.quotes()[investmentTransaction.ticker]?.quote;
      
      if (!quote) {
        throw new Error(`Quote of asset ${asset.ticker} not found`);
      }

      const ticker = investmentTransaction.ticker;

      // Update allocations
      const allocationFound = portfolio.allocations[ticker];
      let transactionFound : {id: string, quantity: number} | undefined;

      // Map context transactions
      const mapTransactions = new Map<string, {id: string, quantity: number}>();
      mapTransactions.set(chgTransaction.id, {...chgTransaction});
      if (!!allocationFound) {
        allocationFound.data.transactions.forEach(t=>mapTransactions.set(t.id, t));
      }

      if (!!allocationFound && (transactionFound = allocationFound.data.transactions.find(t => t.id === chgTransaction.id))) {
        // Update existing allocation with new transaction and rebalance initial value among transactions.
        
        const allocation = new PortfolioAllocation(allocationFound.data);
        transactionFound.quantity = chgTransaction.quantity;

        // Compute initial value based on registered quote in transaction
        const initialValue = investmentTransaction.quote * chgTransaction.quantity;

        // Compute market value based on actual quotation
        const marketValue = quote.value * chgTransaction.quantity;

        // Update the allocation initial value and market value of the allocation with weighted average
        allocation.data = {
          ...allocation.data,
          initialValue,
          marketValue,
          profit: marketValue - initialValue,
          performance: (marketValue - initialValue) / initialValue
        }
        
        portfolio.allocations[investmentTransaction.ticker] = allocation;
      }
      else {
        // Add new allocation and transaction to portfolio
        const initialValue  = investmentTransaction.value.value * chgTransaction.quantity / investmentTransaction.quantity;
        const marketValue   = chgTransaction.quantity * quote.value;
        const percAllocation = marketValue / (portfolio.total.marketValue + marketValue);
        
        const allocation = new PortfolioAllocation({
          ticker,
          initialValue,
          marketValue,
          percPlanned: changes.percPlanned || 0,
          percAllocation,
          performance: (marketValue - initialValue) / initialValue,
          profit: marketValue - initialValue,
          transactions: Array.from(mapTransactions.values())
        })
        mapTransactions.values
        portfolio.allocations[investmentTransaction.ticker] = allocation;
      }

      const allocation = portfolio.allocations[investmentTransaction.ticker];
      const consolidation = allocation.data.transactions.reduce((acc, {id, quantity})=>{
        const investmentTransaction = this.sourceService.investmentSource()[id];
        const initialValue = investmentTransaction.value.value * quantity / investmentTransaction.quantity;
        const marketValue = quote.value * quantity;
        const profit = marketValue - initialValue;
        const performance = profit / initialValue;
        acc.initialValue += initialValue;
        acc.marketValue += marketValue;
        acc.profit += profit;
        acc.performance += performance;
        return acc;
      }, {
        ...INITIAL_TOTAL, 
        // Mantains originals values
        percPlanned: allocation.data.percPlanned,
        percAllocation: allocation.data.percAllocation
      });

      // Updates the consolidation into allocation data
      allocation.data = {
        ...allocation.data,
        ...consolidation
      }

      this.sourceService.updatePortfolio([portfolio]);

      if (!!asset.manualQuote) {
        asset.quote.value = investmentTransaction.quote;
        this.quoteService.updateQuoteAsset({...asset, quote: {...asset.quote, value: investmentTransaction.quote}})
      }
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
            name: result.name,
            currency: result.currency,
            percPlanned: result.percPlanned
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

  getPortfolio(portfolioId: string) {
    return this.portfolios()[portfolioId];
  }

}
