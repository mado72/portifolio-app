import { computed, Injectable, signal } from '@angular/core';
import { format, formatISO, parse, parseISO, setDayOfYear } from 'date-fns';
import { v4 as uuid } from 'uuid';
import assetSourceData from '../../data/assets.json';
import balanceSource from '../../data/balance.json';
import classConsolidationSource from '../../data/class-consolidation.json';
import incomeSource from '../../data/earnings.json';
import portfolioSource from '../../data/portfolio.json';
import statementSource from '../../data/statement-forecast.json';
import transactionsSource from '../../data/transactions.json';
import { AccountTypeEnum, Currency, CurrencyType, StatementEnum } from '../model/domain.model';
import { TransactionEnum, TransactionStatus } from '../model/investment.model';
import { AssetEnum, AssetQuoteType, AssetSourceDataType, BalanceSourceDataType, BalanceType, ClassConsolidationSourceDataType, ClassConsolidationType, IncomeSourceDataType, IncomeType, PortfolioAllocationType, PortfolioRecord, PortfolioSourceDataType, PortfolioType, StatementSourceDataType, StatementType, TransactionSourceDataType, TransactionType } from '../model/source.model';
import { getMarketPlaceCode } from './quote.service';

@Injectable({
  providedIn: 'root'
})
export class SourceService {

  private dataSource = {
    asset: signal<Record<string, AssetSourceDataType>>(this.assertSourceToRecord(assetSourceData.data)),
    balance: signal<Record<string, BalanceSourceDataType>>(this.balanceToRecord(balanceSource.data)),
    classConsolidation: signal<Record<string, ClassConsolidationSourceDataType>>(this.classConsolidationToRecord(classConsolidationSource.data)),
    income: signal<Record<string, IncomeSourceDataType>>(this.incomeSourceToRecord(incomeSource.data.map(item=> {
      return {...item, date: format(setDayOfYear(new Date(), Math.random() * 365), 'yyyy-MM-dd') }; // FIXME: Forçando datas aleatórias
    }))),
    transaction: signal<Record<string, TransactionSourceDataType>>(this.transactionSourceToRecord(transactionsSource.data)),
    statement: signal<Record<string, StatementSourceDataType>>(this.statementSourceToRecord(statementSource.data)),
    portfolio: signal<Record<string, PortfolioSourceDataType>>(this.portfolioSourceToRecord(portfolioSource.data))
  };

  readonly currencyDefault = signal<Currency>(Currency.BRL);

  readonly assertSource = computed(() => Object.entries(this.dataSource.asset()).reduce((acc, [ticker, item]) => {
    const quote = {
      price: item.quote.price, currency: Currency[item.quote.currency as CurrencyType]
    }
    acc[ticker] = { 
      ...item, 
      ticker,
      lastUpdate: parseISO(item.lastUpdate),
      initialPrice: quote.price,
      quote,
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
        price: item.balance,
        currency: Currency[item.currency as CurrencyType],
      },
      date: parseISO(item.date)
    };
    return acc;
  }, {} as Record<string, BalanceType>));

  readonly classConsolidationSource = computed(() => Object.entries(this.dataSource.classConsolidation()).reduce((acc, [key, item]) => {
    acc[key] = {
      ...item,
      financial: {
        price: item.financial,
        currency: Currency[item.currency as CurrencyType]
      }
    }
    return acc;
  }, {} as Record<string, ClassConsolidationType>));

  readonly incomeSource = computed(() => Object.entries(this.dataSource.income()).reduce((acc, [key, item]) => {
    acc[key] = {
      ...item,
      date: parse(item.date, 'yyyy-MM-dd', new Date())
    }
    return acc;
  }, {} as Record<string, IncomeType>));

  readonly transactionSource = computed(() => Object.entries(this.dataSource.transaction()).reduce((acc, [key, item]) => {
    acc[key] = {
      ...item,
      date: parseISO(item.date),
      value: {
        price: item.value.price,
        currency: Currency[item.value.currency as CurrencyType]
      },
      type: TransactionEnum[item.type as keyof typeof TransactionEnum],
      status: TransactionStatus[item.status as keyof typeof TransactionStatus]
    }
    return acc;
  }, {} as Record<string, TransactionType>));

  readonly statementSource = computed(() => Object.entries(this.dataSource.statement()).reduce((acc, [key, item]) => {
    acc[key] = {
      ...item,
      type: StatementEnum[item.type as keyof typeof StatementEnum],
      value: {
        price: item.amount,
        currency: Currency[item.currency as CurrencyType]
      }
    }
    return acc;
  }, {} as Record<string, StatementType>));

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
          const ticker = getMarketPlaceCode(alloc);
          const initialValue = (alloc.initialValue || alloc.marketValue);
          const averagePrice = initialValue / alloc.quantity;
          allocAcc[ticker] = {
            ...asset[ticker],
            ...alloc, 
            ticker,
            initialValue,
            averagePrice,
            quote: {
              price: NaN,
              currency: Currency[alloc.quote?.currency as CurrencyType] || Currency.USD
            },
            profit: alloc.profit || alloc.marketValue - initialValue,
            performance: alloc.performance || (alloc.marketValue - initialValue) / initialValue,
            percAllocation: alloc.percAllocation || 0
          };
          return allocAcc;
        }, {} as Record<string, PortfolioAllocationType>)
      };
      return acc;
    }, {} as Record<string, PortfolioType>);
    return entries;
  });

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
          this.dataSource.asset.set(this.assertSourceToRecord(jsonData.asset));
          this.dataSource.balance.set(this.balanceToRecord(jsonData.balance));
          this.dataSource.classConsolidation.set(this.classConsolidationToRecord(jsonData.classConsolidation));
          this.dataSource.income.set(this.incomeSourceToRecord(jsonData.income));
          this.dataSource.transaction.set(this.transactionSourceToRecord(jsonData.transaction));
          this.dataSource.statement.set(this.statementSourceToRecord(jsonData.statement));
          this.dataSource.portfolio.set(this.portfolioSourceToRecord(jsonData.portfolio));
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
    this.dataSource.classConsolidation.set({});
    this.dataSource.income.set({});
    this.dataSource.transaction.set({});
    this.dataSource.statement.set({});
    this.dataSource.portfolio.set({});
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
      classConsolidation: Object.values(this.dataSource.classConsolidation()),
      income: Object.values(this.dataSource.income()),
      transaction: Object.values(this.dataSource.transaction()),
      statement: Object.values(this.dataSource.statement()),
      portfolio: Object.values(this.dataSource.portfolio())
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

  protected assertSourceToRecord(data: AssetSourceDataType[]) {
    return data.reduce((acc, item) => {
      acc[getMarketPlaceCode(item)] = item;
      return acc;
    }, {} as Record<string, AssetSourceDataType>)
  };

  protected balanceToRecord(data: BalanceSourceDataType[]) {
    return data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, BalanceSourceDataType>)
  }

  protected classConsolidationToRecord(data: ClassConsolidationSourceDataType[]) {
    return data.reduce((acc, item) => {
      acc[item.class] = item;
      return acc;
    }, {} as Record<string, ClassConsolidationSourceDataType>)
  }

  protected incomeSourceToRecord(data: IncomeSourceDataType[]) {
    return data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, IncomeSourceDataType>)
  }

  protected transactionSourceToRecord(data: TransactionSourceDataType[]) {
    return data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, TransactionSourceDataType>)
  }

  protected statementSourceToRecord(data: StatementSourceDataType[]) {
    return data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, StatementSourceDataType>)
  }

  protected portfolioSourceToRecord(data: PortfolioSourceDataType[]) {
    return data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, PortfolioSourceDataType>)
  }

  addAsset(asset: AssetQuoteType) {
    this.dataSource.asset.update(asserts => {
      return {
        ...asserts,
        ...this.assertSourceToRecord([{
          ...asset,
          lastUpdate: formatISO(new Date())
        }])
      };
    })
  }

  updateAsset(changes: AssetQuoteType[]) {
    this.dataSource.asset.update(asserts => {
      return {
        ...asserts,
        ...this.assertSourceToRecord(changes.map(item=>({
          ...item,
          lastUpdate: formatISO(item.lastUpdate)
        })))
      };
    })
  }

  deleteAsset(ticker: string) {
    this.dataSource.asset.update(asserts => {
      delete asserts[ticker];
      
      return { ...asserts };
    })
  }

  addBalance(item: BalanceType) {
    this.dataSource.balance.update(balances => ({
      ...balances,
      ...this.balanceToRecord([{
        ...item,
        id: uuid(),
        balance: item.balance.price,
        currency: item.balance.currency,
        date: formatISO(new Date())
      }])
    }))
  }

  updateBalance(changes: BalanceType[]) {
    this.dataSource.balance.update(balances => ({
      ...balances,
      ...this.balanceToRecord(changes.map(item => ({
        ...item,
        balance: item.balance.price,
        currency: item.balance.currency,
        date: formatISO(new Date())
      })))
    }))
  }

  deleteBalance(id: string) {
    this.dataSource.balance.update(balances => {
      delete balances[id];
      return { ...balances };
    })
  }

  addClassConsolidation(item: ClassConsolidationType) {
    this.dataSource.classConsolidation.update(classConsolidations => {
      return {
        ...classConsolidations,
        ...this.classConsolidationToRecord([{
          ...item,
          financial: item.financial.price,
          currency: item.financial.currency
        }])
      };
    })
  }

  updateClassConsolidation(changes: ClassConsolidationType[]) {
    this.dataSource.classConsolidation.update(classConsolidations => {
      return {
        ...classConsolidations,
        ...this.classConsolidationToRecord(changes.map(item=>({
          ...item,
          financial: item.financial.price,
          currency: item.financial.currency
        })))
      };
    })
  }

  deleteClassConsolidation(classId: string) {
    this.dataSource.classConsolidation.update(classConsolidations => {
      delete classConsolidations[classId];
      return { ...classConsolidations };
    })
  }

  addIncome(item: IncomeType) {
    this.dataSource.income.update(incomes => {
      return {
        ...incomes,
        ...this.incomeSourceToRecord([{
          ...item,
          date: format(item.date, 'yyyy-MM-dd')
        }])
      };
    })
  }

  updateIncome(changes: IncomeType[]) {
    this.dataSource.income.update(incomes => {
      return {
        ...incomes,
        ...this.incomeSourceToRecord(changes.map(item=>({
          ...item,
          date: format(item.date, 'yyyy-MM-dd')
        })))
      };
    })
  }

  deleteIncome(incomeId: string) {
    this.dataSource.income.update(incomes => {
      delete incomes[incomeId];
      return { ...incomes };
    })
  }

  addTransaction(item: TransactionType) {
    this.dataSource.transaction.update(transactions => {
      return {
        ...transactions,
        ...this.transactionSourceToRecord([({
          ...item,
          date: formatISO(item.date)
        })])
      };
    })
  }

  updateTransaction(changes: TransactionType[]) {
    this.dataSource.transaction.update(transactions => ({
      ...transactions,
      ...this.transactionSourceToRecord(changes.map(item => ({
        ...item,
        date: formatISO(item.date)
      })))
    }))
  }

  deleteTransaction(transactionId: string) {
    this.dataSource.transaction.update(transactions => {
      delete transactions[transactionId];
      return { ...transactions };
    })
  }

  addStatement(item: StatementType) {
    this.dataSource.statement.update(statements => ({
      ...statements,
      ...this.statementSourceToRecord([{
        ...item,
        amount: item.value.price,
        currency: item.value.currency
      }])
    }));
  }

  updateStatement(changes: StatementType[]) {
    this.dataSource.statement.update(statements => ({
      ...statements,
      ...this.statementSourceToRecord(changes.map(item => ({
        ...item,
        amount: item.value.price,
        currency: item.value.currency
      })))
    }));
  }

  deleteStatement(statementId: number) {
    this.dataSource.statement.update(statements => {
      delete statements[statementId];
      return { ...statements };
    })
  }

  addPortfolio(item: PortfolioType) {
    this.dataSource.portfolio.update(portfolios => ({
      ...portfolios,
      ...this.portfolioSourceToRecord([{
        ...item,
        allocations: Object.values(item.allocations)
      }])
    }));
  }

  updatePortfolio(changes: PortfolioType[]) {
    this.dataSource.portfolio.update(portfolios => ({
      ...portfolios,
      ...this.portfolioSourceToRecord(changes.map(item => ({
        ...item,
        allocations: Object.values(item.allocations)
      })))
    }));
  }

  deletePortfolio(portfolioId: string) {
    this.dataSource.portfolio.update(portfolios => {
      delete portfolios[portfolioId];
      return { ...portfolios };
    })
    this.dataSource.asset.update(assets=> ({...assets})); // force update
  }
}

