import { computed, inject, Injectable, signal } from '@angular/core';
import { getMonth, getYear } from 'date-fns';
import { Currency } from '../model/domain.model';
import { InvestmentEnum, MonthsNumberArray, ProfitabilityByClass, TransactionStatus } from '../model/investment.model';
import { ClassifyType, InvestmentTransactionType, PortfolioRecord } from '../model/source.model';
import { CellChangeEvent, CellData, RowData } from '../utils/component/financial-grid/financial-gird.model';
import { ClassifyService } from './classify.service';
import { ExchangeService } from './exchange.service';
import { PortfolioService } from './portfolio-service';
import { SourceService } from './source.service';
import { SummarizeService } from './summarize.service';
import { TransactionService } from './transaction.service';

export type AggregatedKinds = 'incomes' | 'contributions' | 'sell' | 'withdrawals';

export type AggregatedTransactionsRows<T> = { [type in AggregatedKinds]: T};

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

  private summarizeService = inject(SummarizeService);

  readonly selectedYear = signal<number>(getYear(new Date()));

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
    const profitabilityRecords = this.sourceService.dataSource.profitability();
    if (!this.sourceService.dataIsLoaded() || !profitabilityRecords) {
      return {};
    }

    return this.extractProfitabilityData(profitabilityRecords, this.exchangeService.currencyDefault());
  });

  /**
   * A computed property that calculates the profitability of the portfolio.
   * It uses the portfolio data from the `portfolioService` and the profitability
   * data from the `sourceService` to compute the result.
   *
   * @readonly
   * @returns The computed profitability of the portfolio.
   */
  readonly portfolioProfitability = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return [];
    }

    return this.computePortfolioProfitability(
      this.selectedYear(), this.portfolioService.portfolios(), this.profitabilitySource());
  });

  /**
   * Computes a mapping of classifier names to their corresponding profitability row data.
   *
   * This computed property checks if the source data is loaded; if not, it returns an empty object.
   * When data is available, it processes the portfolio profitability data, converts it into row data,
   * and maps each classifier name to its respective row. Only classifiers present in the current
   * classifier list and in the profitability data are included in the result.
   *
   * @readonly
   * @returns {Record<string, RowData>} An object mapping classifier names to their profitability row data.
   */
  readonly profitabilityRowsData = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {} as { [classify: string]: RowData };
    }
    return this.mapPortfolioToRowData(this.selectedYear(), this.classifierService.classifiers(), this.portfolioProfitability());
  });

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
  readonly profitabilityTotal = computed<MonthsNumberArray>(() => {
    const profitabilityValues = this.portfolioProfitability();
    if (!profitabilityValues) {
      return Array(12).fill(0) as MonthsNumberArray;
    }

    return this.summarizeService.summarizeMatrix(profitabilityValues);
  });

  /**
   * A computed property that returns the profitability data for the 'Total' classification,
   * formatted as row data suitable for display or further processing.
   * It uses the `convertProfitabilityByClassToRowData` method, passing the 'Total' label and
   * an object containing the classification and its corresponding values from `profitabilityTotal()`.
   *
   * @readonly
   * @returns The row data representation of the total profitability.
   */
  readonly profitabilityTotalRowData = computed(() => {
    const profitabilityValues = this.profitabilityTotal();
    if (!profitabilityValues) {
      return null;
    }
    return this.convertProfitabilityByClassToRowData(this.selectedYear(), 'Total', {classify: 'Total', values: profitabilityValues});
  });

  /**
   * Computes the total end value for the previous year based on the selected year.
   *
   * This computed property retrieves the profitability data for the year prior to the currently selected year,
   * then sums the last value of each row in the profitability data for that year.
   * If there is no data for the previous year, it returns 0.
   *
   * @readonly
   * @returns {number} The sum of the last values from each row of the previous year's profitability data, or 0 if unavailable.
   */
  readonly previousYearEndValue = computed(() => {
    const lastYear = this.selectedYear() - 1;
    const lastYearProfitability = this.profitabilitySource()[lastYear] || {};
    return Object.values(lastYearProfitability).reduce((sum, row) => sum += row[row.length - 1], 0) || 0;
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
  readonly aggregatedTransactions = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return null;
    }

    const aggregatedIncomeWithdrawals = this.aggregateTransactionsByMonth(this.selectedYear(), this.transactionService.investmentTransactions());
    return this.mapMonthlyInvestmentTransactions(aggregatedIncomeWithdrawals, this.exchangeService.currencyDefault());
  });

  /**
   * A computed property that returns the aggregated transactions formatted as row data.
   * 
   * This property computes its value by first retrieving the aggregated transactions
   * using `this.aggregatedTransactions()`. If no aggregated transactions are available,
   * it returns `null`. Otherwise, it transforms the aggregated transactions into a
   * row data format suitable for display or further processing using
   * `this.transformAggregatedTransactionsToRowsData`.
   *
   * @readonly
   * @returns The transformed row data from aggregated transactions, or `null` if no data is available.
   */
  readonly aggregatedTransactionsRows = computed(() => {
    const aggregatedTransactions = this.aggregatedTransactions();

    if (!aggregatedTransactions) {
      return null;
    }

    return this.transformAggregatedTransactionsToRowsData(this.selectedYear(), aggregatedTransactions);
  });

  /**
   * A computed property that generates equity contribution rows for the financial grid.
   */
  readonly equityContributionRows = computed(() => {
    const aggregatedTransactionsRows = this.aggregatedTransactionsRows();
    const profitabilityRows = this.profitabilityRowsData();

    if (!aggregatedTransactionsRows || !profitabilityRows) {
      return null;
    }

    return this.buildEquityContributionRows(this.selectedYear(), aggregatedTransactionsRows, profitabilityRows);
  });
  
  /**
   * Computes the growth rate based on the previous year's end value and the total profitability.
   *
   * This computed property calculates the growth rate by calling the `computeGrowthRate` method
   * from the `summarizeService`, passing in the previous year's end value and the total profitability.
   *
   * @readonly
   * @returns {number} The computed growth rate.
   */
  readonly growthRateValues = computed(() => this.summarizeService.computeGrowthRate(
    this.previousYearEndValue(), this.profitabilityTotal()));

  /**
   * Computes the variation values based on aggregated transactions and profitability data.
   *
   * This computed property aggregates transaction data and calculates the variation
   * using the `summarizeService.computeVariation` method. If there are no aggregated
   * transactions available, it returns `null`.
   *
   * @readonly
   * @returns The computed variation values or `null` if no aggregated transactions exist.
   */
  readonly varianceValues = computed(() => {
    const aggregatedTransactions = this.aggregatedTransactions();

    if (aggregatedTransactions === null) {
      return null;
    }

    return this.summarizeService.computeVariation({
      lastValue: this.previousYearEndValue(),
      values: this.profitabilityTotal(),
      incomes: aggregatedTransactions.incomes,
      withdrawals: aggregatedTransactions.withdrawals,
      contributions: aggregatedTransactions.contributions
    });
  });

  /**
   * Computes the variation rate values based on the current and previous year's data.
   *
   * This computed property retrieves the variation values and aggregated transactions,
   * and if both are available, it calculates the variation rate using the summarizeService.
   * If either the aggregated transactions or variation values are null, it returns null.
   *
   * @readonly
   * @returns {number | null} The computed variation rate value, or null if required data is missing.
   */
  readonly varianceRateValues = computed(() => {
    const variationValues = this.varianceValues();
    const aggregatedTransactions = this.aggregatedTransactions();
    if (aggregatedTransactions === null || variationValues === null) {
      return null;
    }

    return this.summarizeService.computeVariationRate(
      this.previousYearEndValue(),
      variationValues,
      aggregatedTransactions.incomes
    );
  });

  /**
   * A computed property that calculates the accumulated variation values.
   * 
   * It retrieves the variation rate values using `this.variationRateValues()`.
   * If the variation rate values are `null`, it returns `null`.
   * Otherwise, it computes and returns the accumulated variation using
   * `this.summarizeService.computeVariationAccumulated`.
   *
   * @readonly
   * @returns The accumulated variation values, or `null` if variation rate values are not available.
   */
  readonly accumulatedValues = computed(() => {
    const variationRateValues = this.varianceRateValues();
    if (variationRateValues === null) {
      return null;
    }

    return this.summarizeService.computeVariationAccumulated(variationRateValues);
  });

  /**
   * A computed property that calculates the yield rate based on the total profitability
   * and aggregated income transactions. Returns `null` if there are no aggregated transactions.
   *
   * @readonly
   * @returns {number | null} The calculated yield rate, or `null` if no transactions are available.
   */
  readonly yieldValues = computed(() => {
    const aggregatedTransactions = this.aggregatedTransactions();
    if (aggregatedTransactions === null) {
      return null;
    }

    return this.summarizeService.yieldRate(
      this.profitabilityTotal(),
      aggregatedTransactions.incomes
    );
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
    const accumulatedValues = this.accumulatedValues();
    if (!accumulatedValues) {
      return {
        label: 'Rentabilidade Acumulada',
        values: Array(12).fill(0) as number[],
      };
    }

    return {
      label: 'Rentabilidade Acumulada',
      values: accumulatedValues.map(value => value / 100),
    };
  });

  constructor() { }

  /**
   * Transforms aggregated transaction data into a structured format suitable for row-based display.
   *
   * This method rounds each transaction value to two decimal places and constructs a new object
   * containing metadata and cell data for each transaction kind (incomes, contributions, sell, withdrawals).
   * For the current year, disables cells for months beyond the current month.
   *
   * @param aggregatedTransactions - An object containing arrays of transaction values for each transaction kind.
   * @returns An object mapping each transaction kind to its corresponding row data, including labels, operations, and cell states.
   */
  private transformAggregatedTransactionsToRowsData(selectedYear: number, aggregatedTransactions: AggregatedTransactionsRows<number[]>) {
    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    (Object.keys(aggregatedTransactions) as AggregatedKinds[]).forEach(entry => {
      const row = aggregatedTransactions[entry];
      row.forEach((value, idx) => {
        aggregatedTransactions[entry][idx] = Math.round(100 * (value || 0)) / 100;
      });
    });

    const rowsData: AggregatedTransactionsRows<RowData> = {
      incomes: {
        label: 'Proventos',
        disabled: true,
        operation: 'plus',
        cells: aggregatedTransactions.incomes.map((value) => ({ value, disabled: true })),
      },
      contributions: {
        label: 'Aportes',
        disabled: true,
        operation: 'plus',
        cells: aggregatedTransactions.contributions.map((value, idx) => ({ value, disabled: selectedYear === currentYear && idx > currentMonth })),
      },
      sell: {
        label: 'Resgates',
        disabled: true,
        operation: 'minus',
        cells: aggregatedTransactions.sell.map((value, idx) => ({ value, disabled: selectedYear === currentYear && idx > currentMonth })),
      },
      withdrawals: {
        label: 'Retiradas',
        disabled: true,
        operation: 'minus',
        cells: aggregatedTransactions.withdrawals.map((value, idx) => ({ value, disabled: selectedYear === currentYear && idx > currentMonth })),
      }
    };

    return rowsData;
  }

  /**
   * Builds and returns an array of `RowData` objects representing the equity and contribution rows.
   *
   * This method aggregates transaction rows, calculates accumulated contributions,
   * and combines them with incomes and the computed equity row. The equity row is
   * calculated by summing the values of each cell across all profitability rows.
   *
   * @returns {RowData[]} An array of `RowData` objects including equity, contributions,
   * accumulated contributions, and incomes, in that order if available.
   */
  private buildEquityContributionRows(
    selectedYear: number,
    aggregatedTransactionsRows: AggregatedTransactionsRows<RowData>,
    profitabilityRows: { [classify: string]: RowData; }) {

    const contributions = aggregatedTransactionsRows?.contributions;
    const incomes = aggregatedTransactionsRows?.incomes;

    const contributionsAccumulated = this.calculateContributionsAccumulated(selectedYear, contributions);

    const equity = Object.values(profitabilityRows).reduce((acc, row) => {
      acc.cells.forEach((cell, month) => {
        if (cell.value !== undefined) {
          cell.value = (cell.value || 0) + (row.cells[month].value || 0);
        }
      });
      return acc;
    },{
        cells: Array(12).fill(0).map(() => ({ value: 0, disabled: true })),
        disabled: true,
        label: 'Patrimônio',
        operation: 'none',
    } as RowData);

    return (equity ? [equity as RowData] : [])
      .concat(contributions ? [contributions as RowData] : [])
      .concat(contributionsAccumulated ? [contributionsAccumulated as RowData] : [])
      .concat(incomes ? [incomes as RowData] : []);
  }

  /**
   * Extracts and transforms profitability data from the source service.
   *
   * Iterates over the profitability data, organized by year and classification name,
   * and applies currency exchange value retrieval for each value per month.
   *
   * @returns An object where each key is a year (as a string), and each value is an object
   *          mapping classification names to arrays of numbers (one per month), representing
   *          the profitability values after applying exchange value retrieval.
   */
  private extractProfitabilityData(profitabilityRecords: Record<number, Record<string, number[]>>, currencyDefault: Currency): { [year: string]: { [classifyName: string]: number[]; }; } {
    return Object.entries(profitabilityRecords).reduce((acc, [yearStr, classify]) => {
      const year = Number(yearStr + '');

      acc[year] = Object.entries(classify).reduce((accClassify, [classifyName, values]) => {
        accClassify[classifyName] = values.map((value, month) => {
          return this.retrieveExchangeValue(value, year, month, currencyDefault);
        });
        return accClassify;
      },
        {} as { [classifyName: string]: number[]; });
      return acc;
    }, {} as { [year: string]: { [classifyName: string]: number[]; }; });
  }

  /**
   * Maps the portfolio profitability data into a row data structure grouped by classification.
   *
   * This method first reduces the portfolio profitability data into a map keyed by classification,
   * transforming each value using `retrieveExchangeValue` for the selected year and month.
   * It then iterates over the available classifiers, converting each profitability entry into
   * a row data format using `convertProfitabilityByClassToRowData`. Only non-null row data entries
   * are included in the final result.
   *
   * @returns An object mapping each classifier name to its corresponding row data.
   */
  private mapPortfolioToRowData(selectedYear: number, classifiersList: ClassifyType[], profitabilityData: ProfitabilityByClass[], currencyDefault: Currency = this.exchangeService.currencyDefault()) {

    const portfolioProfitabilityMap = profitabilityData.reduce((acc, profitability) => {
      const { classify, values } = profitability;
      acc[classify] = {
        classify,
        values: values.map((value, month) => {
          return this.retrieveExchangeValue(value, selectedYear, month, currencyDefault);
        })
      };
      return acc;
    }, {} as { [classify: string]: ProfitabilityByClass; });

    // Group the profitability data by classification
    return classifiersList.reduce((acc, { id, name }) => {
      const rowData = this.convertProfitabilityByClassToRowData(selectedYear, name, portfolioProfitabilityMap[id]);
      if (!rowData) {
        return acc;
      }
      acc[name] = rowData;
      return acc;
    }, {} as { [classify: string]: RowData; });
  }

  private retrieveExchangeValue(value: number, year: number, month: number, currencyDefault: Currency) {
    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    const exchanges = this.exchangeService.getExchangesByYear(year);

    if (currencyDefault === Currency.BRL) {
      return value;
    }
    const currencyBRL = `${Currency.BRL}`;

    if ((year != currentYear || month <= currentMonth)
      && exchanges[currencyBRL] && exchanges[currencyDefault][currencyBRL]) {
      return (exchanges[currencyDefault][currencyBRL][month]) * value;
    }

    return value;
  }

  /**
   * Converts a `ProfitabilityByClass` object into a row data structure suitable for display.
   *
   * @param profitability - The profitability data grouped by class to be converted.
   * @returns An object containing the label, disabled state, operation type, and an array of cell data.
   *
   * The function uses the selected year and the current date to determine which cells should be disabled.
   * It also maps the class identifier to a human-readable name using the classifier service.
   */
  private convertProfitabilityByClassToRowData(selectedYear: number, label: string, profitability: ProfitabilityByClass): RowData {

    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    return {
        label,
        disabled: false,
        operation: 'plus',
        cells: profitability.values.reduce((acc, value, index) => {
          acc.push({ value, disabled: currentYear === selectedYear && index >= currentMonth });
          return acc;
        }, [] as CellData[])
      };
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

    const initialData: AggregatedTransactionsRows<number[]> = {
      incomes: Array(12).fill(0),
      contributions: Array(12).fill(0),
      sell: Array(12).fill(0),
      withdrawals: Array(12).fill(0),
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
        const investmentValue = this.exchangeService.exchange(investment.value.value, investment.value.currency, currencyDefault).value;
        const value = (acc[accIndex][Number(month) % 12] || 0) + investmentValue;
        acc[accIndex][Number(month) % 12] = value;
      });

      return acc;
    }, initialData)

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
  private calculateContributionsAccumulated(selectedYear: number, contributions?: RowData): RowData | null {
    // Implementação existente...
    const values = Array(12).fill(0) as number[];
    if (!contributions) {
      return null;
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

    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    return {
      label: 'Aportes Acumulados',
      disabled: true,
      operation: 'plus',
      cells: cumulativeMonthlyValues.map((value, month) => ({ value, disabled: selectedYear === currentYear && month > currentMonth })),
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
  private aggregateTransactionsByMonth(selectedYear: number, transactions: Record<string, InvestmentTransactionType>): { [month: number]: InvestmentTransactionType[]; } {
    // Implementação existente...
    return Object.values(transactions)
      .filter(t =>
        t.status === TransactionStatus.COMPLETED
        && getYear(t.date) === selectedYear)
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
   * Calculates the profitability of a portfolio based on the provided source data.
   * This method ensures that the source data is not modified directly by creating a copy
   * and updating it with the current month's profitability values.
   *
   * @param portfolios - The portfolio record containing the data to calculate profitability for.
   * @param profitabilitySource - A nested record structure where the first key is the year, the second key is a classification,
   * and the value is an array of numbers representing monthly profitability values.
   * @returns An array of objects representing profitability by classification, where each object contains:
   * - `classify`: The classification key.
   * - `values`: An array of monthly profitability values for the current year.
   */
  private computePortfolioProfitability(selectedYear: number, portfolios: PortfolioRecord, profitabilitySource: Record<number, Record<string, number[]>>) {
    // Create a copy of the source object to avoid modifying it directly
    if (!profitabilitySource[selectedYear]) {
      return [] as ProfitabilityByClass[];
    }
    
    const profitabilityYear: Record<string, number[]> = profitabilitySource[selectedYear];
    
    const currentYear = getYear(new Date());

    if (currentYear === selectedYear) {
      const currentMonth = getMonth(new Date());

      const items = Object.entries(portfolios).map(([classify, portfolio]) => ({
        classify,
        value: this.exchangeService.exchange(portfolio.total.marketValue, portfolio.currency, this.exchangeService.currencyDefault()).value,
      }));

      const summmarized = this.summarizeService.summarizeClass(items);

      Object.entries(profitabilityYear).forEach(([classify, values]) => {
        const value = summmarized.find(item => item.classify === classify)?.value || 0;
        profitabilityYear[classify] = values.map((v, month) => {
          if (month >= currentMonth) {
            return value;
          }
          return v;
        });
      });
    }
    
    // Updates the copy with the current values
    return Object.keys(this.classifierService.classifiersMap()).map(classify => {
      if (!profitabilityYear[classify]) {
        profitabilityYear[classify] = Array(12).fill(0);
      }
      return {
        classify,
        values: profitabilityYear[classify]
      } as ProfitabilityByClass;
    });
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

    // Update the profitability
    this.updateProfitability(
      this.selectedYear(),
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

  months() {
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  }
}