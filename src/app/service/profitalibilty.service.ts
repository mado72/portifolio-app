import { computed, inject, Injectable } from '@angular/core';
import { getMonth, getYear } from 'date-fns';
import { Currency } from '../model/domain.model';
import { groupBy } from '../model/functions.model';
import { InvestmentEnum, MonthsNumberArray, ProfitabilityByClass, TransactionStatus } from '../model/investment.model';
import { InvestmentTransactionType, PortfolioRecord } from '../model/source.model';
import { CellChangeEvent, CellData, RowData } from '../utils/component/financial-grid/financial-gird.model';
import { ClassifyService } from './classify.service';
import { ExchangeService } from './exchange.service';
import { PortfolioService } from './portfolio-service';
import { SourceService } from './source.service';
import { TransactionService } from './transaction.service';

export type AggregatedKinds = 'incomes' | 'contributions' | 'sell' | 'withdrawals';

export type AggregatedTransactionsRows = { [type in AggregatedKinds]: RowData };

type FinancialMetrics = {
  growthValues: RowData;
  varValues: RowData;
  varPercValues: RowData;
  aggregatedValues: RowData;
  yieldValues: RowData;
};

@Injectable({
  providedIn: 'root'
})
export class ProfitabilityService {

  private classifierService = inject(ClassifyService);

  private sourceService = inject(SourceService);

  private portfolioService = inject(PortfolioService);

  private transactionService = inject(TransactionService);

  private exchangeService = inject(ExchangeService);

  private classifyService = inject(ClassifyService);

  /**
   * A computed property that processes profitability data from the source service.
   * 
   * This property checks if the data is loaded from the source service. If not, it returns an empty object.
   * Otherwise, it transforms the profitability data into a nested structure where:
   * - The outer object keys are years.
   * - The inner object keys are classification names.
   * - The values are arrays of numbers converted to the default currency using the exchange service.
   * 
   * The transformation involves:
   * 1. Iterating over the profitability data entries grouped by year.
   * 2. For each year, iterating over the classifications and their respective values.
   * 3. Mapping each value to its equivalent in the default currency.
   * 
   * @returns An object where each year maps to another object, which maps classification names to arrays of converted numbers.
   */
  readonly profitabilitySource = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {};
    }
    const currencyDefault = this.exchangeService.currencyDefault();

    return Object.entries(this.sourceService.dataSource.profitability()).reduce((acc, [yearStr, classify]) => {
      const year = Number(yearStr+'');

      acc[year] = Object.entries(classify).reduce((accClassify, [classifyName, values]) => {
        accClassify[classifyName] = values.map((value, month) => {
          return this.retrieveExchangeValue(value, year, month);
        });
        return accClassify;
      }
      , {} as { [classifyName: string]: number[] });
      return acc;
    }, {} as { [year: string]: { [classifyName: string]: number[] } });
  });

  /**
   * Computes the profitability for the current month based on the loaded portfolio data.
   * 
   * This computed property checks if the source data is loaded before proceeding. If the data
   * is not loaded, it returns an empty object. Otherwise, it calculates the current month's
   * profitability using the portfolio data provided by the portfolio service.
   * 
   * @returns An object representing the current month's profitability, or an empty object if
   *          the data is not yet loaded.
   */
  readonly currentMonthProfitability = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.getCurrentMonthProfitability(this.portfolioService.portfolios());
  });

  /**
   * A computed property that calculates the profitability of the portfolio.
   * It uses the portfolio data from the `portfolioService` and the profitability
   * data from the `sourceService` to compute the result.
   *
   * @readonly
   * @returns The computed profitability of the portfolio.
   */
  readonly portfolioProfitability = computed(() => this.calculateProfitability(
    this.portfolioService.portfolios(), this.profitabilitySource()));

  /**
   * Computes the total profitability for each month by aggregating data from all profitability rows.
   * 
   * This computed property processes the profitability data by:
   * - Retrieving all rows of profitability data by class.
   * - Converting each row's data into a numeric array.
   * - Summing up the values for each month across all rows.
   * 
   * @returns {MonthsNumberArray} An array of 12 numbers representing the total profitability for each month.
   */
  readonly profitabilityTotalRow = computed<MonthsNumberArray>(() => {
    return Object.values(this.profitabilityByClassRows())
      .map(row => this.rowDataToNumberArray(row))
      .reduce((acc, row) => {
        row.forEach((value, month) => {
          acc[month] += value;
        });
        return acc;
      }, Array(12).fill(0)); // Initialize an array of 12 zeros
  });

  
  /**
   * A computed property that generates a mapping of profitability data by class.
   * 
   * This property checks if the source data is loaded before proceeding. If the data
   * is not loaded, it returns an empty array. Otherwise, it calculates the profitability
   * data for the portfolio and converts it into a row data format, indexed by the 
   * classification label.
   * 
   * @returns A dictionary where the keys are classification labels and the values are 
   *          `RowData` objects representing profitability information for each class.
   */
  readonly profitabilityByClassRows = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return []
    }

    const portfolioProfitability = this.portfolioProfitability();
    return this.convertProfitabilityByClassToRowData(portfolioProfitability, this.currentMonthProfitability())
      .reduce((acc, row) => {
        acc[row.label] = row;
        return acc;
      }, {} as { [classify: string]: RowData });
  });

  /**
   * A computed property that provides aggregated transaction rows.
   * 
   * This property calculates and returns the aggregated investment transactions
   * grouped by month. It first checks if the source data is loaded; if not, it 
   * returns `null`. Once the data is available, it aggregates the investment 
   * transactions by month and maps them to a format suitable for display, using 
   * the default currency from the exchange service.
   * 
   * @returns An array of aggregated transaction rows grouped by month, or `null` 
   *          if the source data is not yet loaded.
   */
  readonly aggregatedTransactionsRows = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return null;
    }

    const aggregatedIncomeWithdrawals = this.aggregateTransactionsByMonth(this.transactionService.investmentTransactions());
    return this.mapMonthlyInvestmentTransactions(aggregatedIncomeWithdrawals, this.exchangeService.currencyDefault());
  });

  /**
   * A computed property that generates financial grid data for the application.
   * 
   * This property depends on the state of the `sourceService` and aggregates
   * profitability and transaction data to produce a structured object containing
   * financial information.
   * 
   * @readonly
   * @returns {object | null} An object containing the financial grid data or `null` 
   * if the source data is not yet loaded. The returned object includes:
   * - `title`: A string representing the title of the financial grid.
   * - `months`: An array of months derived from the `months()` method.
   * - `rows`: An array of rows combining profitability data and aggregated 
   *   transaction data (e.g., sell and withdrawal transactions).
   */
  readonly financialGridData = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return null;
    }
    const aggregatedTransactionsRows = this.aggregatedTransactionsRows();

    const profitabilityRows = Object.values(this.profitabilityByClassRows());
    return {
      title: 'Rendimentos e Resgates',
      months: this.months(),
      rows: profitabilityRows.concat(
        aggregatedTransactionsRows?.sell || [],
        aggregatedTransactionsRows?.withdrawals || [],
      )
    };
  });

  /**
   * A computed property that generates data for the contribution grid.
   * 
   * This property calculates and returns an object containing the title, 
   * months, and rows of data for the grid. The rows are composed of 
   * contributions, accumulated contributions, and incomes, if available.
   * 
   * The computation depends on the following:
   * - Ensures that the source service data is loaded before proceeding.
   * - Aggregates transaction rows to extract contributions and incomes.
   * - Calculates accumulated contributions based on the contributions data.
   * 
   * @returns An object containing:
   * - `title`: A string representing the title of the grid.
   * - `months`: An array of months derived from the `months()` method.
   * - `rows`: An array of row data, including contributions, accumulated contributions, and incomes.
   *           Returns `null` if the source service data is not loaded.
   */
  readonly contributionGridData = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return null;
    }
    const aggregatedTransactionsRows = this.aggregatedTransactionsRows();
    const contributions = aggregatedTransactionsRows?.contributions;
    const contributionsAccumulated = this.calculateContributionsAccumulated(contributions);
    const incomes = aggregatedTransactionsRows?.incomes;

    const rows = (contributions ? [contributions as RowData] : [])
      .concat(contributionsAccumulated ? [contributionsAccumulated as RowData] : [])
      .concat(incomes ? [incomes as RowData] : []);

    return {
      title: 'Aportes e Proventos',
      months: this.months(),
      rows
    };
  });

  /**
   * Computes the financial metric rows based on the profitability data and the previous year's end value.
   * 
   * This computed property checks if the source data is loaded. If not, it returns `undefined`.
   * Otherwise, it calculates the profitability rows by class and retrieves the profitability data
   * for the last year. It then calculates the total value at the end of the previous year and uses
   * this value to compute the variantions for the profitability rows on year.
   * 
   * @returns An array of calculated financial metric rows or `undefined` if the source data is not loaded.
   */
  readonly financialMetricRows = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return undefined;
    }

    const profitabilityMatrix = Object.values(this.profitabilitySource()[getYear(new Date())]);

    const lastYear = getYear(new Date()) - 1;
    const lastYearProfitability = this.profitabilitySource()[lastYear] || {};
    const previousYearEndValue = Object.values(lastYearProfitability).reduce((sum, row) => sum += row[row.length - 1], 0) || 0;
    return this.calculateVAR(profitabilityMatrix, previousYearEndValue, getYear(new Date()));
  });

  /**
   * A computed property that generates the data structure for the growth grid.
   * This grid contains financial profitability metrics, including growth values,
   * VAR, VAR%, accumulated values, and yield values. If the source data is not
   * loaded, the property returns `undefined`.
   *
   * @readonly
   * @returns An object containing the title, months, and rows for the growth grid.
   *          Each row represents a specific financial metric with its label, 
   *          disabled state, operation type, cells, and optional suffix.
   */
  readonly growthGridData = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return undefined;
    }

    const financialProfitabilityMetrics = this.financialMetricRows();
    const rows = [
      financialProfitabilityMetrics?.growthValues ?? { label: 'Crescimento', disabled: true, operation: 'none', cells: [] },
      financialProfitabilityMetrics?.varValues ?? { label: 'VAR', disabled: true, operation: 'none', cells: [] },
      financialProfitabilityMetrics?.varPercValues ?? { label: 'VAR%', disabled: true, operation: 'none', cells: [], suffix: '%' },
      financialProfitabilityMetrics?.aggregatedValues ?? { label: 'Acumulado', disabled: true, operation: 'none', cells: [], suffix: '%' },
      financialProfitabilityMetrics?.yieldValues ?? { label: 'Yield', disabled: true, operation: 'none', cells: [], suffix: '%' }
    ];
    return {
      title: 'Crescimento',
      months: this.months(),
      rows
    };
  });

  /**
   * A computed property that provides data for the portfolio evolution chart.
   * 
   * This property calculates the evolution of the portfolio's value over time.
   * If the source data is not loaded, it returns `null`. If the total profitability
   * data is unavailable or empty, it returns a default object with a label and an
   * array of 12 zero values. Otherwise, it returns an object containing the label
   * and the calculated total values.
   * 
   * @returns An object containing the label and an array of values representing
   *          the portfolio's evolution, or `null` if the source data is not loaded.
   */
  readonly portfolioEvolutionData = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return null;
    }
    const total = this.profitabilityTotalRow();

    if (!total?.length) {
      return {
        label: 'Evolução do Patrimônio',
        values: Array(12).fill(0) as number[],
      };
    }

    return {
      label: 'Evolução do Patrimônio',
      values: total
    };
  });

  /**
   * A computed property that provides accumulated profitability data.
   * 
   * This property calculates and returns an object containing a label and an array of values
   * representing the accumulated profitability. If the source data is not loaded or the 
   * financial metric rows are unavailable, it defaults to a label of "Rentabilidade Acumulada"
   * and an array of 12 zeros.
   * 
   * @readonly
   * @returns An object with the following structure:
   * - `label`: A string indicating the label for the accumulated profitability.
   * - `values`: An array of numbers representing the accumulated profitability values, 
   *   normalized to percentages (divided by 100).
   */
  readonly accumulatedData = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {
        label: 'Rentabilidade Acumulada',
        values: Array(12).fill(0) as number[],
      };
    }
    const calculatePortfolioProfitability = this.financialMetricRows();
    if (!calculatePortfolioProfitability) {
      return {
        label: 'Rentabilidade Acumulada',
        values: Array(12).fill(0) as number[],
      };
    }
    return {
      label: 'Rentabilidade Acumulada',
      values: calculatePortfolioProfitability.aggregatedValues.cells
        .map(cell => (cell.value || 0) / 100),
    };
  });

  constructor() { }

  private retrieveExchangeValue(value: number, year: number, month: number): any {
    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    const exchanges = this.exchangeService.getExchangesByYear(year);
    const currencyDefault = this.exchangeService.currencyDefault();

    if (currencyDefault === Currency.BRL) {
      return value;
    }
    const currencyBRL = `${Currency.BRL}`;

    if ((year != currentYear || month <= currentMonth) 
      && exchanges[currencyBRL] && exchanges[currencyDefault][currencyBRL]) {
      return (exchanges[currencyDefault][currencyBRL][month]) * value;
    }
  }

  /**
   * Converts an array of profitability data by class into a structured row data format.
   *
   * @param profitabilities - An array of `ProfitabilityByClass` objects, where each object contains
   *                          a classification and its corresponding values.
   * @param currentMonthProfitability - A record mapping classifications to their profitability values
   *                                    for the current month.
   * @returns An array of `RowData` objects, where each row represents a classification with its
   *          associated data, including label, operation, and cell values.
   *
   * The function processes the profitability data by iterating over the input array and constructing
   * rows. For each classification, it determines whether the cell values should be derived from the
   * current month's profitability or the provided values, based on the current month. Cells for
   * future months are marked as disabled.
   */
  private convertProfitabilityByClassToRowData(profitabilities: ProfitabilityByClass[], currentMonthProfitability: Record<string, number>) {
    const currentMonth = getMonth(new Date());

    const classifiersMap = this.classifierService.classifiersMap();

    return Object.values(profitabilities).reduce((rows, { classify, values }) => {
      rows.push({
        label: classifiersMap[classify]?.name || classify,
        disabled: false,
        operation: 'plus',
        cells: values.reduce((acc, value, index) => {
          acc.push({ value: index >= currentMonth ? currentMonthProfitability[classify] || 0 : value, disabled: index >= currentMonth });
          return acc;
        }, [] as CellData[])
      });
      return rows;
    }, [] as RowData[]);
  }

  /**
   * Maps monthly investment transactions into an aggregated structure for financial reporting.
   *
   * @param transactionsByMonth - An object where the keys represent months (0-11) and the values are arrays of investment transactions for that month.
   * @param currencyDefault - The default currency to which all transaction values will be converted.
   * @returns An object containing aggregated transaction data for each category (incomes, contributions, sell, withdrawals),
   *          with each category containing a label, operation type, and an array of monthly cell values.
   *
   * The returned structure includes:
   * - `incomes`: Aggregated income transactions (e.g., dividends, IOE returns, rent returns).
   * - `contributions`: Aggregated contribution transactions (e.g., contributions, sells).
   * - `sell`: Aggregated sell transactions.
   * - `withdrawals`: Aggregated withdrawal transactions.
   *
   * Each category contains:
   * - `label`: A string label for the category.
   * - `disabled`: A boolean indicating whether the category is disabled.
   * - `operation`: A string representing the operation type ('plus' or 'minus').
   * - `cells`: An array of 12 objects (one for each month) containing:
   *   - `value`: The aggregated value for the month, rounded to two decimal places.
   *   - `disabled`: A boolean indicating whether the cell is disabled (based on the current month).
   *
   * The function uses the `exchangeService` to convert transaction values to the default currency.
   * It also ensures that cell values are rounded to two decimal places.
   */
  private mapMonthlyInvestmentTransactions(transactionsByMonth: { [month: number]: InvestmentTransactionType[]; }, currencyDefault: Currency) {

    const currentMonth = getMonth(new Date());

    const initialData: AggregatedTransactionsRows = {
      incomes: {
        label: 'Proventos',
        disabled: true,
        operation: 'plus',
        cells: Array(12).fill(0).map(() => ({ value: 0, disabled: true })),
      },
      contributions: {
        label: 'Aportes',
        disabled: true,
        operation: 'plus',
        cells: Array(12).fill(0).map((_, idx) => ({ value: 0, disabled: idx > currentMonth })),
      },
      sell: {
        label: 'Resgates',
        disabled: true,
        operation: 'minus',
        cells: Array(12).fill(0).map((_, idx) => ({ value: 0, disabled: idx > currentMonth })),
      },
      withdrawals: {
        label: 'Retiradas',
        disabled: true,
        operation: 'minus',
        cells: Array(12).fill(0).map((_, idx) => ({ value: 0, disabled: idx > currentMonth })),
      }
    };

    const computed = Object.entries(transactionsByMonth).reduce((acc, [month, investments]) => {
      investments.forEach((investment) => {
        let accIndex: AggregatedKinds;
        switch (investment.type) {
          case InvestmentEnum.DIVIDENDS:
          case InvestmentEnum.IOE_RETURN:
          case InvestmentEnum.RENT_RETURN:
            accIndex = 'incomes';
            break;
          case InvestmentEnum.CONTRIBUTION:
          case InvestmentEnum.BUY:
            accIndex = 'contributions';
            break;
          case InvestmentEnum.WITHDRAWAL:
            accIndex = 'withdrawals';
            break;
          case InvestmentEnum.SELL:
            accIndex = 'sell';
            break;
          default:
            return;
        }
        const value = this.exchangeService.exchange(investment.value.value, investment.value.currency, currencyDefault).value;
        const cell = acc[accIndex].cells[Number(month) % 12];
        if (cell && cell.value !== undefined) {
          cell.value = (cell.value || 0) + value;
        }
      });

      return acc;
    }, initialData)

    Object.values(computed).map(row => {
      row.cells.forEach(cell => cell.value = Math.round(100 * (cell.value || 0)) / 100);
      return row;
    });

    return computed;
  }

  /**
   * Calculates the accumulated contributions over a 12-month period.
   * 
   * This method takes an object where the keys represent months (0-based index)
   * and the values represent the contributions for those months. It returns an
   * array of 12 numbers, where each index contains the accumulated sum of contributions
   * up to that month.
   * 
   * @param contributions - An object where the keys are month indices (0-11) and the values are the contributions for each month.
   * @returns An array of 12 numbers representing the accumulated contributions for each month.
   */
  private calculateContributionsAccumulated(contributions?: RowData): RowData | undefined {
    // Implementação existente...
    const values = Array(12).fill(0) as number[];
    if (!contributions) {
      return undefined;
    }
    Object.values(contributions.cells).forEach((cell, month) => {
      values[month] = cell.value || 0;
    });

    // Calculate the accumulated values
    const cumulativeMonthlyValues = values.reduce((acc, value, index) => {
      if (index === 0) {
        acc[index] = value;
      } else {
        acc[index] = acc[index - 1] + value;
      }
      return acc;
    }, [] as number[]);

    const currentMonth = getMonth(new Date());

    return {
      label: 'Aportes Acumulados',
      disabled: true,
      operation: 'plus',
      cells: cumulativeMonthlyValues.map((value, month) => ({ value, disabled: month > currentMonth })),
    } as RowData;
  }

  /**
   * Extracts income and withdrawal transactions from the given transactions object,
   * grouping them by month. The transactions are filtered based on their type and status.
   *
   * @param transactions - A record of investment transactions, where each transaction
   *                      includes details such as type, status, and date.
   * @returns An object where the keys are month numbers (0-11) and the values are arrays
   *          of InvestmentTransactionType objects for that month.
   */
  private aggregateTransactionsByMonth(transactions: Record<string, InvestmentTransactionType>): { [month: number]: InvestmentTransactionType[]; } {
    // Implementação existente...
    return Object.values(transactions)
      .filter(t =>
        t.status === TransactionStatus.COMPLETED
        && getYear(t.date) === getYear(new Date()))
      .reduce((acc, t) => {
        const month = getMonth(t.date);
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(t);
        return acc;
      }, {} as { [month: number]: InvestmentTransactionType[]; });
  }

  /**
   * Calculates the current month's profitability for a given set of portfolios,
   * grouped by their classification. The profitability is converted to the default
   * currency using the exchange service.
   *
   * @param portfolios - An object containing portfolio records, where each record
   *                     includes details such as classification, market value, and currency.
   * @returns An object where the keys are portfolio classifications and the values
   *          are the total profitability for each classification, rounded to two decimal places.
   */
  private getCurrentMonthProfitability(portfolios: PortfolioRecord) {
    // Implementação existente...
    const currencyDefault = this.exchangeService.currencyDefault();

    const portfoliosMap = groupBy(Object.values(portfolios), (portfolio) => portfolio.classify?.id || '');

    const classes = Array.from(portfoliosMap.keys()).reduce((acc, className) => {
      const ports = portfoliosMap.get(className);
      if (!!ports?.length) {
        acc[className] = ports.reduce((accPorts, portfolio) => {
          accPorts += this.exchangeService.exchange(portfolio.total.marketValue, portfolio.currency, currencyDefault).value;
          return Math.round(accPorts * 100) / 100;
        }, 0);
      }
      return acc;
    }, {} as { [classify: string]: number; });
    return classes;
  }

  /**
   * Calculates the profitability of a portfolio based on the provided source data.
   * This method ensures that the source data is not modified directly by creating a copy
   * and updating it with the current month's profitability values.
   *
   * @param portfolios - The portfolio record containing the data to calculate profitability for.
   * @param source - A nested record structure where the first key is the year, the second key is a classification,
   * and the value is an array of numbers representing monthly profitability values.
   * @returns An array of objects representing profitability by classification, where each object contains:
   * - `classify`: The classification key.
   * - `values`: An array of monthly profitability values for the current year.
   */
  private calculateProfitability(portfolios: PortfolioRecord, source: Record<number, Record<string, number[]>>) {
    if (!this.sourceService.dataIsLoaded()) {
      return [];
    }
    const currentMonth = getMonth(new Date());
    const currentYear = getYear(new Date());

    // Create a copy of the source object to avoid modifying it directly
    const updatedSource = { ...source };
    if (!updatedSource[currentYear]) {
      updatedSource[currentYear] = {};
    }

    const current = this.getCurrentMonthProfitability(portfolios);

    // Updates the copy with the current values
    Object.entries(current).forEach(([classify, value]) => {
      if (!updatedSource[currentYear][classify]) {
        updatedSource[currentYear][classify] = Array(12).fill(0);
      }
      updatedSource[currentYear][classify][currentMonth] = value;
    });

    return Object.entries(updatedSource[currentYear]).map(([classify, values]) => ({
      classify,
      values
    } as ProfitabilityByClass));
  }

  /**
   * Converts row data to an array of numbers, defaulting to 0 if the value is undefined.
   * @param rowData - The row data to convert.
   * @returns An array of numbers representing the cell values in the row.
   */
  private rowDataToNumberArray(rowData?: RowData): number[] {
    if (!rowData) {
      return Array(12).fill(0); // Return an empty array if rowData is not provided
    }
    // Map the cells to an array of numbers, defaulting to 0 if the value is undefined
    return rowData.cells.map(cell => cell.value || 0);
  }

  /**
   * Calculates various financial metrics (VAR, growth, yield, etc.) based on profitability data
   * and previous year's end value.
   *
   * @param profitabilityByClassRows - An array of `RowData` representing profitability data by class.
   * @param previousYearEndValue - The profitability value at the end of the previous year.
   * @returns A `FinancialMetrics` object containing calculated financial metrics, or `undefined` 
   *          if profitability data is not provided.
   *
   * The function performs the following calculations for each month:
   * - Growth: Percentage growth of profitability compared to the previous month.
   * - VAR: The difference between the current profitability and the adjusted previous profitability.
   * - VAR%: The percentage representation of the VAR value.
   * - Aggregated VAR%: Cumulative percentage VAR over the months.
   * - Yield: The percentage yield based on income and current profitability.
   *
   * The results are returned as a `FinancialMetrics` object, with each metric formatted as a 
   * `RowData` object for display purposes.
   */
  private calculateVAR(profitabilityMatrix: number[][], previousYearEndValue: number, year: number): FinancialMetrics | undefined {
    
    if (!profitabilityMatrix.length) {
      return undefined; // Return undefined if profitabilityRows is not provided
    }

    const monthArray = Array(12).fill(0);

    const growthValues = monthArray.slice() as MonthsNumberArray;
    const varValues = monthArray.slice() as MonthsNumberArray;
    const varPercValues = monthArray.slice() as MonthsNumberArray;
    const aggregatedValues = monthArray.slice() as MonthsNumberArray;
    const yieldValues = monthArray.slice() as MonthsNumberArray;

    const profitabilityRows: MonthsNumberArray = Array(12).fill(0);

    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    profitabilityMatrix.forEach((row) => {
      row.forEach((value, month) => {
        if (month === 0 || currentYear != year || month <= currentMonth) {
          profitabilityRows[month] +=  value || 0;
        }
        else {
          profitabilityRows[month] = profitabilityRows[month-1];
        }
      });
    });

    const aggregatedTransactionsRows = this.aggregatedTransactionsRows();

    const contributionsRows: MonthsNumberArray = this.rowDataToNumberArray(aggregatedTransactionsRows?.contributions); // AM
    const sellRows: MonthsNumberArray = this.rowDataToNumberArray(aggregatedTransactionsRows?.sell); // RgM
    const withdrawalsRows: MonthsNumberArray = this.rowDataToNumberArray(aggregatedTransactionsRows?.withdrawals); // RtM
    const incomeRows: MonthsNumberArray = this.rowDataToNumberArray(aggregatedTransactionsRows?.incomes); // PM

    let previousProfitability = previousYearEndValue;
    for (let month = 0; month < 12; month++) {
      const currentProfitability = profitabilityRows[month] || 0;
      const contributions = contributionsRows[month] || 0;
      const sells = sellRows[month] || 0;
      const withdrawals = withdrawalsRows[month] || 0;
      const income = incomeRows[month] || 0;

      // Calculate growth for the month
      growthValues[month] = Math.round(10000 * ((profitabilityRows[month] / previousProfitability) - 1)) / 100 || 0;

      // Calculate the VAR value for the month
      varValues[month] = Math.round(100 * (currentProfitability - (previousProfitability + contributions - withdrawals - sells - income))) / 100;

      // Calculate VAR% for the month
      varPercValues[month] = Math.round(10000 * varValues[month] / (previousProfitability + contributions)) / 100;

      // Calculate the aggregated VAR% for the month
      if (month == 0) {
        aggregatedValues[month] = varPercValues[month];
      }
      else {
        aggregatedValues[month] = (1 + varPercValues[month] / 100) * (1 + aggregatedValues[month - 1]) - 1;
      }

      // Calculate the yield for the month
      yieldValues[month] = Math.round(10000 * (income / currentProfitability)) / 100 || 0;

      // Update the previousProfitability for the next iteration
      previousProfitability = currentProfitability || 0;
    }

    return {
      growthValues: this.monthNumberArrayToRowData("Crescimento", growthValues, { suffix: ' %' }),
      varValues: this.monthNumberArrayToRowData("VAR", varValues),
      varPercValues: this.monthNumberArrayToRowData("VAR%", varPercValues, { suffix: ' %' }),
      aggregatedValues: this.monthNumberArrayToRowData("Acumulado", aggregatedValues, { suffix: ' %' }),
      yieldValues: this.monthNumberArrayToRowData("Yield", yieldValues, { suffix: ' %' }),
    } as FinancialMetrics;
  }

  /**
   * Updates the financial grid data based on a cell change event.
   *
   * This method modifies the value of a specific cell in the financial grid data
   * and updates the profitability using the `updateProfitability` method.
   *
   * @param event - The cell change event containing the following properties:
   *   - `rowIndex`: The index of the row in the grid.
   *   - `columnIndex`: The index of the column in the grid.
   *   - `value`: The new value to be set in the cell.
   *   - `rowLabel`: The label of the row being updated.
   */
  updateFinancialGridData(event: CellChangeEvent) {
    const { rowIndex, columnIndex, value, rowLabel } = event;
    const gridData = this.financialGridData();
    if (gridData) {
      const row = gridData.rows[rowIndex];
      if (row && row.cells[columnIndex]) {
        row.cells[columnIndex].value = value;
      }
    }

    // Update the profitability
    this.updateProfitability(
      getYear(new Date()),
      rowLabel,
      columnIndex,
      value ?? 0
    );
  }

  /**
   * Updates the profitability data for a specific year, classification, and month with a given value.
   * If the year or classification does not exist in the profitability data, it initializes them.
   *
   * @param year - The year for which the profitability data is being updated.
   * @param classifyName - The classification/category of the profitability data.
   * @param month - The month (0-indexed) for which the profitability value is being updated.
   * @param value - The new profitability value to set for the specified year, classification, and month.
   * @returns A promise or result from the `sourceService.updateProfitability` method, indicating the update status.
   */
  updateProfitability(year: number, classifyName: string, month: number, value: number) {

    const profiltability = this.profitabilitySource();

    const classify = this.classifyService.getClassifyByName(classifyName)?.id || classifyName;

    if (!profiltability[year]) {
      profiltability[year] = {};
    }
    if (!profiltability[year][classify]) {
      profiltability[year][classify] = Array(12).fill(0);
    }
    profiltability[year][classify][month] = value;


    return this.sourceService.updateProfitability(year, classify, profiltability[year][classify]);
  }

  monthNumberArrayToRowData(label: string, monthNumberArray: MonthsNumberArray, options?: { prefix?: string, suffix?: string }): RowData {
    const currentMonth = getMonth(new Date());
    return {
      label,
      disabled: true,
      operation: 'none',
      cells: monthNumberArray.map((value, month) => ({ value, disabled: month > currentMonth })),
      prefix: options?.prefix,
      suffix: options?.suffix
    } as RowData;
  }

  months() {
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  }
}