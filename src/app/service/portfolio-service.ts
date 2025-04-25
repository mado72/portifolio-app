import { computed, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Currency, CurrencyType, CurrencyValue, isTransactionDeposit } from '../model/domain.model';
import { ExchangeStructureType, InvestmentEnumFactor } from '../model/investment.model';
import { AssetQuoteType, PortfolioAllocation, PortfolioAllocationsArrayItemType, PortfolioAllocationSourceRawType, PortfolioAllocationStructureType, PortfolioRecord, PortfolioSourceRawType, PortfolioType, SummarizedDataType, Ticker } from '../model/source.model';
import { PortfolioRegisterDialogComponent } from '../portfolio/portfolio-register-dialog/portfolio-register-dialog.component';
import { AssetService } from './asset.service';
import { ExchangeService } from './exchange.service';
import { getMarketPlaceCode } from './quote.service';
import { SourceService } from './source.service';
import { TransactionService } from './transaction.service';

const INITIAL_TOTAL = Object.freeze({
  initialValue: 0,
  marketValue: 0,
  percPlanned: 0,
  profit: 0,
  performance: 0
} as Required<SummarizedDataType>);

export type PortfolioAllocationChangeType = {
  ticker: string;
  percPlanned: number;
  marketValue?: number;
}

export type PortfolioChangeType = {
  name?: string;
  percPlanned?: number;
  currency?: Currency;
  class?: string;
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

  private assetService = inject(AssetService);

  private exchangeService = inject(ExchangeService);

  // ---- Signals -------------------------------------------

  /**
   * A computed property that calculates the total summary of all portfolios.
   * It iterates through all portfolio objects, converting their totals to the default currency
   * and accumulating the results into a single summary object.
   *
   * @readonly
   * @returns An object representing the summarized total of all portfolios in the default currency.
   */
  readonly total = computed(() => Object.values(this.portfolios())
    .reduce((acc, portfolio) => {
      const currencyDefault = this.exchangeService.currencyDefault();

      // Summarizes portfolio total
      const summarized = this.summarize(
        { currency: currencyDefault, result: acc },
        { currency: portfolio.currency, item: portfolio.total });
      
      // Summarizes portfolios percentual planned
      summarized.percPlanned += portfolio.percPlanned;
      
      return summarized;
    }, { ...INITIAL_TOTAL }))


  /**
   * A computed property that generates a record of portfolios by processing raw portfolio data
   * and mapping it to a structured format. It depends on the data being loaded and the availability
   * of assets from the source service.
   *
   * @readonly
   * @returns {PortfolioRecord} A record of portfolios where each key is the portfolio ID and the value
   * is the parsed portfolio data. Returns an empty object if data is not loaded or no assets are found.
   */
  readonly portfolios = computed<PortfolioRecord>(() => {
    // Waits for data loaded
    if (!this.sourceService.dataIsLoaded()) return {};

    const portfolios = this.sourceService.dataSource.portfolio();
    
    // No assets found
    if (!Object.keys(portfolios).length) {
      return {};
    }
    
    const assets = this.sourceService.assetSource();

    const portfoliosMap = Object.values(this.sourceService.dataSource.portfolio())
      .reduce((rec, raw)=>{
        rec[raw.id] = this.parsePortfolioSourceRawType(raw, assets);
        return rec;
      }, {} as PortfolioRecord)
    
    return portfoliosMap;
  });

  /**
   * A computed property that transforms the portfolio data into an array of portfolio allocation items.
   * Each portfolio item includes its allocations as an array and calculates the percentage allocation
   * of the portfolio's total market value relative to the overall market value.
   *
   * @readonly
   * @returns {PortfolioAllocationsArrayItemType[]} An array of portfolio allocation items, where each item
   * contains the portfolio data, its allocations as an array, and the calculated percentage allocation.
   */
  readonly portfolioAllocation = computed(() =>
    this.getAllPortfolios().map(portfolio => ({
      ...portfolio,
      allocations: Object.values(portfolio.allocations),
      total: {
        ...portfolio.total,
        percAllocation: this.exchangeService.exchange(
          portfolio.total.marketValue,
          portfolio.currency,
          this.exchangeService.currencyDefault()).value / this.total().marketValue
      },
    } as PortfolioAllocationsArrayItemType)));

  constructor() { }

  /**
   * Summarizes allocation transactions for a given portfolio allocation source.
   *
   * This method calculates the initial value, market value, profit, performance, 
   * and planned percentage of a portfolio allocation based on its transactions 
   * and associated asset data.
   *
   * @param alloc - The portfolio allocation source containing transaction data 
   *                and planned percentage information.
   * 
   * @returns An object summarizing the allocation, including:
   *          - `initialValue`: The total initial value of the allocation.
   *          - `marketValue`: The current market value of the allocation.
   *          - `profit`: The profit calculated as the difference between 
   *            market value and initial value.
   *          - `performance`: The performance ratio calculated as profit 
   *            divided by initial value.
   *          - `percPlanned`: The planned percentage of the allocation.
   */
  private summarizeAllocationTransactions(alloc: PortfolioAllocationSourceRawType) {
    const asset = this.sourceService.assetSource()[alloc.ticker];
    
    const transactions = this.sourceService.investmentSource();
    
    /**
     * Represents a summarized allocation object that aggregates transaction data
     * to calculate total quantities, initial values, and market values.
     */
    const allocationSummarized = {
      ...alloc.transactions.reduce((acc, t) => {
        const transaction = transactions[t.id];

        // If transaction not found in delete operation
        if (!transaction) {
          return acc;
        }
        const factor = InvestmentEnumFactor[transaction.type];

        const quantity = factor * t.quantity;
        const transactionValue = quantity * transaction.value.value;

        acc.quantity += quantity;
        acc.initialValue += transactionValue;

        const marketValue = factor > 0 ? quantity * asset.quote.value : transactionValue;
        // If the factor < 0, then market value is immutable
        acc.marketValue += marketValue;
        acc.profit += marketValue - transactionValue;

        return acc;
      }, { ...INITIAL_TOTAL, quantity: 0 })
    };

    allocationSummarized.performance = allocationSummarized.profit / allocationSummarized.initialValue;
    allocationSummarized.percPlanned = alloc.percPlanned;
    return allocationSummarized;
  }

  /**
   * Parses raw portfolio source data and constructs a structured portfolio object.
   *
   * @param raw - The raw portfolio source data of type `PortfolioSourceRawType`.
   * @param assets - A record mapping asset tickers to their corresponding `AssetQuoteType` data.
   * 
   * @returns A structured portfolio object of type `PortfolioType` containing:
   * - The portfolio's currency.
   * - A summarized map of portfolio allocations keyed by ticker symbol.
   * - The total portfolio values.
   *
   * @remarks
   * - The function processes raw allocation data to create a summarized map of allocations.
   * - It calculates the total portfolio values by aggregating data from individual allocations.
   * - The percentage share of each allocation in the portfolio is computed based on market value.
   */
  private parsePortfolioSourceRawType(raw: PortfolioSourceRawType, assets: Record<string, AssetQuoteType>) {
    const portfolioCurrency = Currency[raw.currency as keyof typeof Currency];

    /**
     * Creates a summarized map of portfolio allocations keyed by ticker symbol.
     *
     * This map is generated by iterating over the raw allocation data, summarizing
     * the allocation transactions for each ticker, and constructing a new
     * `PortfolioAllocation` instance for each ticker. The resulting map contains
     * the ticker as the key and the corresponding `PortfolioAllocation` object as
     * the value.
     */
    const allocSummarizedMap = raw.allocations.reduce((allocMap, allocRaw)=>{
      const allocData = {
        ticker: allocRaw.ticker,
        ...this.summarizeAllocationTransactions(allocRaw),
        transactions: allocRaw.transactions
      };
      allocMap[allocRaw.ticker] = new PortfolioAllocation(allocData);
      return allocMap;
    }, {} as Record<Ticker, Required<PortfolioAllocation>>);

    let portfolioTotal = { ...INITIAL_TOTAL };
    Object.values(allocSummarizedMap).forEach(alloc=>{
      this.summarize(
        {currency: portfolioCurrency, result: portfolioTotal},
        {currency: assets[alloc.data.ticker]?.quote.currency || portfolio.currency, item: alloc.data}
      )
    });

    // Calculates the percentage share of the allocation in the portfolio
    Object.values(allocSummarizedMap).forEach(alloc => {
      alloc.data.percAllocation = alloc.data.marketValue / portfolioTotal.marketValue;
    })

    const portfolio: PortfolioType = {
      ...raw,
      currency: portfolioCurrency,
      allocations: allocSummarizedMap,
      total: portfolioTotal
    }

    return portfolio;
  }


  /**
   * Summarizes financial data by aggregating values from a source object into an accumulator object.
   *
   * @param acc - The accumulator object containing the target currency and the aggregated result.
   * @param acc.currency - The target currency for the aggregation.
   * @param acc.result - The aggregated financial data.
   * @param source - The source object containing the currency and financial data to be aggregated.
   * @param source.currency - The currency of the source financial data.
   * @param source.item - The financial data to be aggregated.
   * @returns The updated aggregated financial data in the accumulator.
   */
  private summarize(
    acc: { currency: Currency, result: Required<SummarizedDataType> },
    source: { currency: Currency, item: Required<SummarizedDataType> }) {

    acc.result.initialValue += this.exchangeService.exchange(source.item.initialValue, source.currency, acc.currency).value;
    acc.result.marketValue += this.exchangeService.exchange(source.item.marketValue, source.currency, acc.currency).value;
    acc.result.profit += this.exchangeService.exchange(source.item.profit, source.currency, acc.currency).value;
    acc.result.performance += this.exchangeService.exchange(source.item.performance, source.currency, acc.currency).value;
    acc.result.percPlanned += this.exchangeService.exchange(source.item.percPlanned, source.currency, acc.currency).value;
    return acc.result;
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
      currency: this.exchangeService.currencyDefault()
    };
    const consolidation = Object.values(portfolios
      .map(portfolio => {
        const result = {
          ...portfolio,
          value: { ...this.exchangeService.enhanceExchangeInfo(portfolio.total, portfolio.currency, ["marketValue"]).marketValue },
          percAlloc: 0
        };
        return result
      })
      .reduce((acc, portfolio) => {

        if (!acc[portfolio.classify]) {
          acc[portfolio.classify] = { ...portfolio }
        }
        else {
          acc[portfolio.classify] = {
            ...acc[portfolio.classify],
            value: {
              ...acc[portfolio.classify],
              original: {
                ...acc[portfolio.classify].value.original,
                value: acc[portfolio.classify].value.original.value + portfolio.value.original.value
              },
              exchanged: {
                ...acc[portfolio.classify].value.exchanged,
                value: acc[portfolio.classify].value.exchanged.value + portfolio.value.exchanged.value
              }
            },
            percPlanned: acc[portfolio.classify].percPlanned + portfolio.percPlanned
          }
        }
        total.value += portfolio.value.exchanged.value;
        return acc;
      }, {} as Record<string, {
        classify: string,
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

  addPortfolio({ name, currency, percPlanned, classify }: { name: string; currency: CurrencyType; percPlanned: number; classify: string}) {
    return this.sourceService.addPortfolio({
      id: '',
      name,
      percPlanned,
      currency: Currency[currency],
      classify,
      allocations: []
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
    const portfolio = this.portfolios()[portfolioId];
    if (!portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }
    
    const portfolioRaw : PortfolioSourceRawType = { 
      ...portfolio,
      allocations: Object.values(portfolio.allocations).map(alloc=>({
        ...alloc.data
      }))
    };
    const allocationMap = portfolioRaw.allocations.reduce((acc, alloc)=>{
      acc[alloc.ticker] = alloc;
      return acc;
    }, {} as Record<Ticker, PortfolioAllocationSourceRawType>)

    if (changes.name) portfolioRaw.name = changes.name;
    if (changes.currency) portfolioRaw.currency = Currency[changes.currency];
    if (changes.percPlanned) portfolioRaw.percPlanned = changes.percPlanned;
    if (changes.class) portfolioRaw.classify = changes.class;

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
        : asset.quote;

      if (!quote) {
        throw new Error(`Quote of asset ${asset.ticker} not found`);
      }

      const ticker = investmentTransaction.ticker;

      // Update allocations
      const allocationFound = allocationMap[ticker];
      let transactionFound: { id: string, quantity: number } | undefined;

      // Map context transactions
      const mapTransactions = new Map<string, { id: string, quantity: number }>();
      mapTransactions.set(chgTransaction.id, { ...chgTransaction });
      if (!!allocationFound) {
        allocationFound.transactions.forEach(t => mapTransactions.set(t.id, t));
      }

      if (!!allocationFound) {
        if ((transactionFound = allocationFound.transactions.find(t => t.id === chgTransaction.id))) {
          // Update existing transaction quantity.
          transactionFound.quantity = chgTransaction.quantity;
        }
        else {
          // Add transaction to allocation found
          allocationFound.transactions.push({...chgTransaction});
        }
      }
      else {
        // Add new allocation and transaction to portfolio
        const initialValue = investmentTransaction.value.value * chgTransaction.quantity / investmentTransaction.quantity;
        const marketValue = chgTransaction.quantity * quote.value;
        const percAllocation = marketValue / (portfolio.total.marketValue + marketValue);

        const allocation : PortfolioAllocationSourceRawType = {
          ticker,
          initialValue,
          marketValue,
          percPlanned: changes.percPlanned || 0,
          percAllocation,
          performance: (marketValue - initialValue) / initialValue,
          profit: marketValue - initialValue,
          transactions: Array.from(mapTransactions.values())
        }
        portfolioRaw.allocations.push(allocation);
      }

      if (!!asset.manualQuote) {
        asset.quote.value = investmentTransaction.quote;
        this.assetService.updateAsset(asset);
      }
    }

    this.sourceService.updatePortfolio([portfolioRaw]);
  }

  openPortfolioDialog({ title, portfolioInfo }: { title: string; portfolioInfo: string | { id?: string; name: string, currency: Currency, percPlanned: number, classify: string } }) {
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
            percPlanned: result.percPlanned,
            class: result.classify
          });
        }
      }
    });
    return dialogRef;
  }

  portfoliosOfAsset(asset: AssetQuoteType): PortfolioType[] {
    return this.getAllPortfolios()
      .filter(portfolio => portfolio.allocations[asset.ticker]?.data.transactions.reduce((acc, t) => acc += t.quantity, 0) > 0)
  }

  getPortfolio(portfolioId: string) {
    return this.portfolios()[portfolioId];
  }

}
