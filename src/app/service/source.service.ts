import { computed, Injectable, signal } from '@angular/core';
import { format, formatISO, parseISO, setDayOfYear } from 'date-fns';
import { v4 as uuid } from 'uuid';
import assetSourceData from '../../data/assets.json';
import balanceSource from '../../data/balance.json';
import cashflowTransactionSource from '../../data/cashflow-transaction.json';
import incomeSource from '../../data/earnings.json';
import investmentTransactionsSource from '../../data/investment-transactions.json';
import portfolioSource from '../../data/portfolio.json';
import scheduledSource from '../../data/scheduled-account-transaction.json';
import { AccountTypeEnum, Currency, CurrencyType, Scheduled, TransactionEnum } from '../model/domain.model';
import { parseDateYYYYMMDD } from '../model/functions.model';
import { InvestmentEnum, TransactionStatus } from '../model/investment.model';
import {
  AssetEnum, AssetQuoteType, AssetSourceDataType as AssetSourceRawType, BalanceSourceDataType as BalanceSourceRawType, BalanceType,
  IncomeSourceDataType as IncomeSourceRawType, IncomeType,
  InvestmentTransactionSourceRawType as InvestmentTransactionSourceRawType, InvestmentTransactionType, PortfolioAllocationType,
  PortfolioRecord, PortfolioSourceRawType as PortfolioSourceRawType, PortfolioType, ScheduledsSourceDataType as ScheduledsSourceRawType,
  ScheduledStatemetType, TransactionSourceRawType as TransactionSourceRawType, TransactionType
} from '../model/source.model';
import { getMarketPlaceCode } from './quote.service';

@Injectable({
  providedIn: 'root'
})
export class SourceService {

  private dataSource = {
    asset: signal<Record<string, AssetSourceRawType>>(this.assetSourceToRecord(assetSourceData.data)),
    balance: signal<Record<string, BalanceSourceRawType>>(this.balanceToRecord(balanceSource.data)),
    income: signal<Record<string, IncomeSourceRawType>>(this.incomeSourceToRecord(incomeSource.data.map(item => {
      return { ...item, date: format(setDayOfYear(new Date(), Math.random() * 365), 'yyyy-MM-dd') }; // FIXME: Forçando datas aleatórias
    }))),
    investment: signal<Record<string, InvestmentTransactionType>>(this.investmentSourceToRecord(investmentTransactionsSource.data)),
    cashflow: signal<Record<string, TransactionType>>(this.cashSourceToRecord(cashflowTransactionSource.data)), // FIXME forçando data para o mês corrente
    portfolio: signal<Record<string, PortfolioSourceRawType>>(this.portfolioSourceToRecord(portfolioSource.data)),
    scheduled: signal<Record<string, ScheduledStatemetType>>(this.scheduledSourceToRecord(scheduledSource.data))
  };

  readonly currencyDefault = signal<Currency>(Currency.BRL);

  readonly assetSource = computed(() => Object.entries(this.dataSource.asset()).reduce((acc, [ticker, item]) => {
    const quote = {
      value: item.quote.value, 
      currency: Currency[item.quote.currency as CurrencyType]
    }
    acc[ticker] = {
      ...item,
      ticker,
      lastUpdate: parseISO(item.lastUpdate),
      initialPrice: quote.value,
      quote: {
        currency: quote.currency,
        value: quote.value
      },
      type: AssetEnum[item.type as keyof typeof AssetEnum],
      trend: 'unchanged'
    };
    return acc;
  }, {} as Record<string, AssetQuoteType>));

  readonly balanceSource = computed(() => Object.entries(this.dataSource.balance()).reduce((acc, [key, item]) => {
    acc[key] = {
      ...item,
      type: AccountTypeEnum[item.type as keyof typeof AccountTypeEnum],
      balance: {
        value: item.balance,
        currency: Currency[item.currency as CurrencyType],
      },
      date: parseISO(item.date)
    };
    return acc;
  }, {} as Record<string, BalanceType>));

  readonly incomeSource = computed(() => Object.entries(this.dataSource.income()).reduce((acc, [key, item]) => {
    acc[key] = {
      ...item,
      date: parseDateYYYYMMDD(item.date)
    }
    return acc;
  }, {} as Record<string, IncomeType>));

  readonly investmentSource = computed(() => this.dataSource.investment());

  readonly cashflowSource = computed(() => this.dataSource.cashflow());

  readonly portfolioSource = computed<PortfolioRecord>(() => {
    const asset = this.dataSource.asset();
    const entries = Object.entries(this.dataSource.portfolio()).reduce((acc, [key, item]) => {
      acc[key] =
      {
        ...item,
        currency: Currency[item.currency as keyof typeof Currency],
        total: {
          initialValue: NaN,
          marketValue: NaN,
          percPlanned: NaN,
          percAllocation: NaN,
          profit: NaN,
          performance: NaN
        },
        allocations: item.allocations.reduce((allocAcc, alloc) => {
          const ticker = alloc.ticker;
          const initialPrice = (alloc.initialValue || alloc.marketValue);
          const averagePrice = initialPrice / alloc.quantity;
          allocAcc[ticker] = {
            ...asset[ticker],
            ...alloc,
            ticker,
            initialPrice,
            averagePrice,
            quote: {
              value: NaN,
              currency: Currency[alloc.quote?.currency as CurrencyType] || Currency.USD
            },
            profit: alloc.profit || alloc.marketValue - initialPrice,
            performance: alloc.performance || (alloc.marketValue - initialPrice) / initialPrice,
            percAllocation: alloc.percAllocation || 0,
            trend: "unchanged",
            manualQuote: !!asset[ticker]?.manualQuote,
            lastUpdate: new Date(asset[ticker]?.lastUpdate),
            type: AssetEnum[asset[ticker]?.type as keyof typeof AssetEnum]
          };
          return allocAcc;
        }, {} as Record<string, PortfolioAllocationType>)
      };
      return acc;
    }, {} as Record<string, PortfolioType>);
    return entries;
  });

  readonly scheduledSource = computed(() => this.dataSource.scheduled())

  constructor() { }

  /**
   * Handles the file selection event and loads the selected JSON file into the data source.
   *
   * @param event - The event object containing the file selection details.
   * @remarks
   * This function reads the selected file, parses its content as JSON, and sets the parsed data
   * as the new data source. It also displays success or error messages based on the file loading process.
   */
  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Parse JSON and set data
        try {
          const jsonData = JSON.parse(e.target.result);
          this.dataSource.asset.set(this.assetSourceToRecord(jsonData.asset));
          this.dataSource.balance.set(this.balanceToRecord(jsonData.balance));
          this.dataSource.income.set(this.incomeSourceToRecord(jsonData.income));
          this.dataSource.investment.set(this.investmentSourceToRecord(jsonData.investment));
          this.dataSource.cashflow.set(this.cashSourceToRecord(jsonData.cashflow));
          this.dataSource.portfolio.set(this.portfolioSourceToRecord(jsonData.portfolio));
          this.dataSource.scheduled.set(this.scheduledSourceToRecord(jsonData.scheduled));
          alert('Dados carregados com sucesso!');
        } catch (error) {
          alert('Erro ao carregar o arquivo JSON.');
        }
      };
      reader.readAsText(file);
    }
  }

  emptyAllData() {
    this.dataSource.asset.set({});
    this.dataSource.balance.set({});
    this.dataSource.income.set({});
    this.dataSource.investment.set({});
    this.dataSource.cashflow.set({});
    this.dataSource.portfolio.set({});
    this.dataSource.scheduled.set({});
    alert('Todos os dados foram excluídos!');
  }

  /**
   * This function downloads the current data source as a JSON file.
   * It converts the data source object to a JSON string, creates a Blob object,
   * generates a URL for the Blob object, creates an anchor element, sets the anchor's
   * href attribute to the URL, sets the download attribute to the specified filename,
   * and triggers a click event on the anchor element to initiate the download.
   * Finally, it revokes the URL object to free up system resources.
   *
   * @param filename - The name of the JSON file to be downloaded.
   *                    Defaults to 'data.json' if not provided.
   *
   * @returns {void} - This function does not return any value.
   */
  downloadDataAsJson(filename: string = 'data.json') {
    const data = {
      asset: Object.values(this.dataSource.asset()),
      balance: Object.values(this.dataSource.balance()),
      income: Object.values(this.dataSource.income()),
      investment: Object.values(this.dataSource.investment()),
      cashflow: Object.values(this.dataSource.cashflow()),
      portfolio: Object.values(this.dataSource.portfolio()),
      scheduled: Object.values(this.dataSource.scheduled())
    }
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  protected assetSourceToRecord(data: AssetSourceRawType[]) {
    return data.reduce((acc, item) => {
      acc[getMarketPlaceCode(item)] = item;
      return acc;
    }, {} as Record<string, AssetSourceRawType>)
  };

  protected balanceToRecord(data: BalanceSourceRawType[]) {
    return data.reduce((acc, item) => {
      acc[item.id as string] = item;
      return acc;
    }, {} as Record<string, BalanceSourceRawType>)
  }

  protected incomeSourceToRecord(data: IncomeSourceRawType[]) {
    return data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, IncomeSourceRawType>)
  }

  protected investmentSourceToRecord(data: InvestmentTransactionSourceRawType[]): Record<string, InvestmentTransactionType> {
    return data.reduce((acc, item) => {
      acc[item.id] = {
        ...item,
        date: parseISO(item.date),
        value: {
          value: item.value.value,
          currency: Currency[item.value.currency as CurrencyType]
        },
        type: InvestmentEnum[item.type as keyof typeof InvestmentEnum],
        status: TransactionStatus[item.status as keyof typeof TransactionStatus]
      }
      return acc;
    }, {} as Record<string, InvestmentTransactionType>);
  }

  protected cashSourceToRecord(data: TransactionSourceRawType[]) {
    return data.reduce((acc, item) => {
      acc[item.id as string] = {
        ...item,
        date: parseDateYYYYMMDD(item.date),
        scheduledRef: item.scheduled_ref,
        originAccountId: item.account_id,
        type: TransactionEnum[item.type as keyof typeof TransactionEnum],
        value: {
          value: item.amount,
          currency: Currency[item.currency as keyof typeof Currency]
        },
        status: TransactionStatus[item.status as keyof typeof TransactionStatus]
      };
      return acc;
    }, {} as Record<string, TransactionType>)
  }

  protected portfolioSourceToRecord(data: PortfolioSourceRawType[]) {
    return data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, PortfolioSourceRawType>)
  }

  protected scheduledSourceToRecord(data: ScheduledsSourceRawType[]) {
    return data.reduce((acc, item) => {
      acc[item.id as string] = {
        ...item,
        amount: {
          currency: Currency[item.amount.currency as keyof typeof Currency],
          value: item.amount.value
        },
        type: TransactionEnum[item.type as keyof typeof TransactionEnum],
        scheduled: {
          type: Scheduled[item.scheduled.type as keyof typeof Scheduled],
          startDate: parseDateYYYYMMDD(item.scheduled.startDate),
          endDate: item.scheduled.endDate ? parseDateYYYYMMDD(item.scheduled.endDate) : undefined
        }
      };
      return acc;
    }, {} as Record<string, ScheduledStatemetType>)
  }

  // asset ------------------------
  assetToSource(items: AssetQuoteType[]): AssetSourceRawType[] {
    return items.map(item => ({
      ...item,
      lastUpdate: formatISO(item.lastUpdate || new Date())
    }));
  }

  addAsset(asset: AssetQuoteType) {
    const added = this.assetSourceToRecord(this.assetToSource([asset]).map(item=>({...item, id: uuid()})));
    this.dataSource.asset.update(assets => ({
      ...assets,
      ...added
    }))
    return Object.values(added)[0]
  }

  updateAsset(changes: AssetQuoteType[]) {
    const updated = this.assetSourceToRecord(this.assetToSource(changes));
    this.dataSource.asset.update(assets => ({
      ...assets,
      ...updated
    }))
    return Object.values(updated)
  }

  deleteAsset(ticker: string) {
    this.dataSource.asset.update(asserts => {
      delete asserts[ticker];

      return { ...asserts };
    })
  }

  // balance ------------------
  balanceToSource(items: BalanceType[]): BalanceSourceRawType[] {
    return items.map(item => ({
      ...item,
      balance: item.balance.value,
      currency: item.balance.currency,
      date: formatISO(new Date())
    }));
  }

  addBalance(item: BalanceType) {
    const added = this.balanceToRecord(this.balanceToSource([item]).map(item=>({...item, id: uuid()})));
    this.dataSource.balance.update(balances => ({
      ...balances,
      ...added
    }))
    return Object.values(added)[0];
  }

  updateBalance(changes: BalanceType[]) {
    const updated = this.balanceToRecord(this.balanceToSource(changes));
    this.dataSource.balance.update(balances => ({
      ...balances,
      ...updated
    }))
    return updated;
  }

  deleteBalance(id: string) {
    this.dataSource.balance.update(balances => {
      delete balances[id];
      return { ...balances };
    })
  }

  // income ---------------------
  incomeToSource(items: IncomeType[]) : IncomeSourceRawType[] {
    return items.map(item => ({
      ...item,
      date: format(item.date, 'yyyy-MM-dd')
    }))
  }

  addIncome(item: IncomeType) {
    const added = this.incomeSourceToRecord(this.incomeToSource([item])
      .map(item => ({ ...item, id: uuid() })));
    
    this.dataSource.income.update(incomes => ({
        ...incomes,
        ...added
    }))
    return Object.values(added)[0];
  }

  updateIncome(changes: IncomeType[]) {
    const updated = this.incomeSourceToRecord(changes.map(item => ({
      ...item,
      date: format(item.date, 'yyyy-MM-dd')
    })));

    this.dataSource.income.update(incomes => ({
      ...incomes,
      ...updated
    }))
    return Object.values(updated);
  }

  deleteIncome(incomeId: string) {
    this.dataSource.income.update(incomes => {
      delete incomes[incomeId];
      return { ...incomes };
    })
  }

  // investment -----------------

  updateInvestmentToSource(items: InvestmentTransactionType[]) : InvestmentTransactionSourceRawType[]{
    return items.map(item => ({
      ...item,
      date: formatISO(item.date)
    }))
  }

  addInvestmentTransaction(item: InvestmentTransactionType) {
    const newTransaction = this.investmentSourceToRecord(
      this.updateInvestmentToSource([item]).map(item=>({...item, id: uuid()})))

    this.dataSource.investment.update(transactions => ({
        ...transactions,
        ...newTransaction
    }))
    return Object.values(newTransaction)[0]
  }

  updateInvestmentTransaction(changes: InvestmentTransactionType[]) {
    const itemsUpdated = this.investmentSourceToRecord(this.updateInvestmentToSource(changes));

    this.dataSource.investment.update(transactions => ({
      ...transactions,
      ...itemsUpdated
    }));
    return Object.values(itemsUpdated);
  }

  deleteInvestmentTransaction(transactionId: string) {
    this.dataSource.investment.update(transactions => {
      delete transactions[transactionId];
      return { ...transactions };
    })
  }

  // cashflow ----------------------------

  cashflowTransactionTypeToSource(changes: TransactionType[]): TransactionSourceRawType[] {
    return changes.map(item => ({
      ...item,
      date: format(item.date, 'yyyy-MM-dd'),
      scheduled_ref: item.scheduledRef,
      account_id: item.originAccountId,
      amount: item.value.value,
      currency: item.value.currency as string
    }))
  }

  addCashflowTransaction(item: TransactionType) {
    const added = this.cashSourceToRecord(
      this.cashflowTransactionTypeToSource([item]).map(item=>({...item, id: uuid()}))
    )

    this.dataSource.cashflow.update(items => ({
      ...items,
      ...added
    }));
    return Object.values(added)[0];
  }

  updateCashflowTransaction(changes: TransactionType[]) {
    const updated = this.cashSourceToRecord(
      this.cashflowTransactionTypeToSource(changes)
    );

    this.dataSource.cashflow.update(items => ({
      ...items,
      ...updated
    }));
    return Object.values(updated);
  }

  deleteCashflowTransaction(transactionId: number) {
    this.dataSource.cashflow.update(items => {
      delete items[transactionId];
      return { ...items };
    })
  }

  // portfolio ------------------------
  portfolioToSource(items: PortfolioType[]): PortfolioSourceRawType[] {
    return items.map(item => ({
      ...item,
      allocations: Object.values(item.allocations)
    }))
  }

  addPortfolio(item: PortfolioType) {
    const added = this.portfolioSourceToRecord(
      this.portfolioToSource([item]).map(item=>({...item, id: uuid()}))
    );

    this.dataSource.portfolio.update(portfolios => ({
      ...portfolios,
      ...added
    }));
    return Object.values(added)[0]
  }

  updatePortfolio(changes: PortfolioType[]) {
    const updated = this.portfolioSourceToRecord(this.portfolioToSource(changes));
    this.dataSource.portfolio.update(portfolios => ({
      ...portfolios,
      ...updated
    }));
    return Object.values(updated)
  }

  deletePortfolio(portfolioId: string) {
    this.dataSource.portfolio.update(portfolios => {
      delete portfolios[portfolioId];
      return { ...portfolios };
    })
    this.dataSource.asset.update(assets => ({ ...assets })); // force update
  }

  // scheduledTransaction --------------

  scheduledTransactionToSource(items: ScheduledStatemetType[]): ScheduledsSourceRawType[] {
    return items.map(item=>({
      ...item,
      scheduled: {
        ...item.scheduled,
        startDate: format(item.scheduled.startDate, 'yyyy-MM-dd'),
        endDate: item.scheduled.endDate ? format(item.scheduled.endDate, 'yyyy-MM-dd') : undefined
      }
    }))
  }

  addScheduledTransaction(item: ScheduledStatemetType) {
    const added = this.scheduledSourceToRecord(
      this.scheduledTransactionToSource([item])
        .map(item=>({...item, id: uuid()})));
    
    this.dataSource.scheduled.update(scheduleds => ({
      ...scheduleds,
      ...added
    }));
    return Object.values(added)[0]
  }

  updateScheduledTransaction(changes: ScheduledStatemetType[]) {
    const updated = this.scheduledSourceToRecord(this.scheduledTransactionToSource(changes));

    this.dataSource.scheduled.update(scheduleds => ({
      ...scheduleds,
      ...updated
    }));
    return Object.values(updated)
  }

  deleteScheduledTransaction(scheduledId: string) {
    this.dataSource.scheduled.update(scheduleds => {
      delete scheduleds[scheduledId];
      return { ...scheduleds };
    })
    this.dataSource.asset.update(assets => ({ ...assets })); // force update
  }
}

