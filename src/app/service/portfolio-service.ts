import { computed, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Currency, CurrencyType, CurrencyValue } from '../model/domain.model';
import { ExchangeStructureType } from '../model/investment.model';
import { AssetQuoteType, PortfolioAllocationRecord, PortfolioAllocationsArrayItemType, PortfolioAllocationType, PortfolioRecord, PortfolioType, SummarizedDataType } from '../model/source.model';
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

export type PortfolioChangeType = {
  name?: string;
  currency?: Currency;
  transactionId?: string;
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

  private sourceService = inject(SourceService);

  private dialog = inject(MatDialog);

  private quoteService = inject(QuoteService);

  readonly portfolios = computed<PortfolioRecord>(() => {
    const assets = this.sourceService.assetSource();
    const quotes = this.quoteService.quotes() || {};
    
    const entries = Object.entries(this.sourceService.dataSource.portfolio()).reduce((acc, [key, item]) => {
  
      const exchangeFn = (value: number, currency: Currency) => {
        return this.quoteService.exchange(value, currency, Currency[item.currency as keyof typeof Currency] );
      }

      let allocTotal = {... INITIAL_TOTAL}

      const allocations = item.allocations.reduce((allocAcc, alloc) => {
        const ticker = alloc.ticker;
        const asset = assets[ticker];
        if (!asset) {
          console.warn(`Asset not found: ${ticker}`);
          alert(`Asset not found: ${ticker}`);
          return allocAcc;
        }
        const initialValue = alloc.initialValue;
        const currentValue = quotes[ticker]?.quote.value * alloc.quantity || alloc.marketValue;

        const transactions = (alloc.transactions || []).concat(
          alloc?.transactions || []).filter((item, index, self) => {
            return index === self.findIndex((t) => t === item);
        });
        
        // Produces a new object with the same properties as asset[ticker] and alloc
        // and adds the total to it
        allocAcc[ticker] = {
          ...alloc,
          ticker,
          marketValue: currentValue,
          quantity: alloc.quantity,
          initialValue,
          profit: currentValue - initialValue,
          performance: (currentValue - initialValue) / initialValue,
          percAllocation: alloc.percAllocation || 0,
          transactions,
        };

        const v = exchangeFn(allocAcc[ticker].marketValue, asset.quote.currency).value;

        allocTotal = {
          ...allocTotal,
          initialValue: (allocTotal.initialValue || 0) + exchangeFn(alloc.initialValue, asset.quote.currency).value,
          marketValue: (allocTotal.marketValue || 0) + exchangeFn(alloc.marketValue, asset.quote.currency).value,
          percPlanned: (allocTotal.percPlanned || 0) + alloc.percPlanned,
          profit: (allocTotal.profit || 0) + exchangeFn(alloc.profit || 0, asset.quote.currency).value
        }
        return allocAcc;
      }, {} as Record<string, PortfolioAllocationType>);

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
        const assetCurrency = this.sourceService.assetSource()[alloc.ticker]?.quote?.currency || portfolio.currency;
        this.summarize({currency: portfolio.currency, total: accPort}, {currency: assetCurrency, total: alloc});
        return accPort;
      }, {...INITIAL_TOTAL} as Required<SummarizedDataType>);

      Object.values(portfolio.allocations).forEach(alloc => {
        alloc.percAllocation = alloc.marketValue / portfolio.total.marketValue;
      });
      
      this.summarize({currency: this.sourceService.currencyDefault(), total: acc}, {...portfolio});
      return acc;
    },
    {...INITIAL_TOTAL} as Required<SummarizedDataType>);

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

  private summarize(acc: {currency: Currency, total: Required<SummarizedDataType>}, alloc: {currency: Currency, total: Required<SummarizedDataType>}) {
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
          let allocation = portfolio.allocations[ticker] as { ticker: string; percPlanned: number; quantity: number; marketValue?: number; transactionId?: string};
          if (!!allocation && allocation.transactionId === transactionId) {
            allocation = {
              ...allocation,
              quantity: qty,
              marketValue: qty * quote,
            }
          }
          else {
            allocation = {
              ticker,
              percPlanned: portfolio.percPlanned,
              quantity: qty,
              marketValue: qty * quote,
            }
          }
          const changes: PortfolioChangeType = {
            ...portfolio,
            transactionId,
            allocations: allocation ? [allocation] : []
          };
          this.updatePortfolio(portId, changes);
        }
      })
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
      const allocations = portfolio.allocations;
      const assets = this.quoteService.quotes() || {};
      const quotesChanged = new Map<string, number>();

      changes.allocations?.forEach(({ ticker, percPlanned, quantity, marketValue }) => {
        const [marketPlace, code] = ticker.split(':');
        const allocation = allocations[ticker];

        const asset = this.sourceService.assetSource()[ticker];
        
        const manualQuote = !!asset?.manualQuote && !!marketValue;
        let mv = marketValue || asset.quote.value * quantity;
        let initialValue = allocation?.initialValue || mv;
        const quote = { currency: asset.quote.currency, value: mv / quantity };

        if (allocation && quantity === 0) { // Remove allocation
          delete allocations[ticker];
        }
        else if (allocation) { // Update existing allocation
          const tickerAsset = assets[ticker];

          if (!tickerAsset) {
            throw new Error(`Quote not found: ${ticker}`);
          }

          let addNewTransaction = false;
          const transactions = allocation.transactions || [];
          if (changes.transactionId) {
            if (!transactions.includes(changes.transactionId)) {
              addNewTransaction = true;
            }
            transactions.push(changes.transactionId);
          }

          if (addNewTransaction) {
            // Update existing allocation with new transaction

            // Update the initial value and market value of the allocation
            initialValue = (mv * allocation.quantity + allocation.initialValue * quantity) / (allocation.quantity + quantity);
            mv = asset.quote.value * (allocation.quantity + quantity);

            // Update the allocation with the new values
            allocations[ticker] = {
              ticker,
              percPlanned, 
              quantity: quantity + allocation.quantity, 
              initialValue,
              marketValue: mv,
              profit: mv - initialValue,
              performance: (mv - initialValue) / initialValue,
              percAllocation: mv / portfolio.total.marketValue,
              transactions,
            };
            }
          else {
            // Update the allocation with the new values for new transaction
            allocations[ticker] = {
              ticker,
              percPlanned, quantity, initialValue,
              marketValue: mv,
              profit: mv - initialValue,
              performance: (mv - initialValue) / initialValue,
              percAllocation: mv / portfolio.total.marketValue,
              transactions,
            };
            }
        }
        else {
          if (!asset) {
            throw new Error(`Asset not found: ${ticker}`);
          }
          
          const transactions = changes.transactionId ? [changes.transactionId] : [];
          
          allocations[ticker] = {
            ticker,
            percPlanned, quantity, initialValue,
            marketValue: mv,
            profit: 0,
            performance: 0,
            percAllocation: 0,
            transactions
          };
        }

        if (manualQuote) {
          quotesChanged.set(ticker, marketValue / quantity);
        }
      });

      delete changes.transactionId;

      this.sourceService.updatePortfolio([{
        ...portfolio,
        ...changes,
        allocations: Object.entries(allocations).reduce((acc, [ticker, item]) => {
          acc[ticker] = {
            ...item,
            ticker
          }
          return acc;
        }, {} as PortfolioAllocationRecord),
      }]);

      quotesChanged.forEach((value, ticker) => {
        const asset = this.sourceService.assetSource()[ticker];
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
          const transactions = Object.values(result.allocations).reduce((acc, allocation) => {
            acc[allocation.ticker] = allocation.transactions;
            return acc;
          }, {} as Record<string, string[]>);

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

  getPortfolio(portfolioId: string) {
    return this.portfolios()[portfolioId];
  }

}
