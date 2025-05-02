import { computed, inject, Injectable } from '@angular/core';
import { groupBy } from '../model/functions.model';
import { ExchangeService } from './exchange.service';
import { PortfolioService } from './portfolio-service';
import { getMonth, getYear } from 'date-fns';
import { SourceService } from './source.service';
import { TransactionService } from './transaction.service';
import { InvestmentTransactionType, PortfolioRecord } from '../model/source.model';
import { InvestmentEnum, MonthsNumberArray, TransactionStatus } from '../model/investment.model';
import { ProfitabilityByClass } from '../model/investment.model';
import { CellChangeEvent, CellData, RowData } from '../utils/component/financial-grid/financial-gird.model';
import { Currency } from '../model/domain.model';

export type AggregatedKinds = 'incomes' | 'contributions' | 'redemptions' | 'withdrawals';

export type AggregatedTransactionsRows = { [type in AggregatedKinds]: RowData };

@Injectable({
  providedIn: 'root'
})
export class ProfitabilityService {
  private sourceService = inject(SourceService);

  private portfolioService = inject(PortfolioService);

  private transactionService = inject(TransactionService);

  private exchangeService = inject(ExchangeService);

  currentMonthProfitability = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.getCurrentMonthProfitability(this.portfolioService.portfolios());
  });

  // Modificado para usar o sinal profitability do SourceService
  profitabilityByClassRows = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return []
    }

    const profitabilityByClass = this.calculateProfitability(
      this.portfolioService.portfolios(), this.sourceService.dataSource.profitability());
    return this.convertProfitabilityByClassToRowData(profitabilityByClass, this.currentMonthProfitability())
      .reduce((acc, row) => {
        acc[row.label] = row;
        return acc;
      }, {} as { [classify: string]: RowData });
  });

  aggregatedTransactionsRows = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return null;
    }

    const aggregatedIncomeWithdrawals = this.aggregateTransactionsByMonth(this.transactionService.investmentTransactions());
    return this.mapMonthlyInvestmentTransactions(aggregatedIncomeWithdrawals, this.exchangeService.currencyDefault());
  });

  financialGridData = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return null;
    }
    const aggregatedTransactionsRows = this.aggregatedTransactionsRows();

    const profitabilityRows = Object.values(this.profitabilityByClassRows());
    return {
      title: 'Rendimentos e Resgates',
      months: this.months(),
      rows: profitabilityRows.concat(
        aggregatedTransactionsRows?.redemptions || [],
        aggregatedTransactionsRows?.withdrawals || [],
      )
    };
  });

  contributionGridData = computed(() => {
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

  growthGridData = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return null;
    }
    const profitabilityByClassRows = Object.values(this.profitabilityByClassRows());
    const previousYearEndValue = profitabilityByClassRows.reduce((acc, row) => {
      const firstMonthCell = row.cells[0]; // Gets the cell of the first month
      if (firstMonthCell?.value) {
        acc += firstMonthCell.value; // Adds the values of the cells from the first month
      }
      return acc;
    }, 0) || 0;
    // TODO: Deveria ser o valor do ano anterior, não o total do primeiro mês 

    const profitabilityRows = this.calculateVAR(profitabilityByClassRows, previousYearEndValue);
    const rows = [
      profitabilityRows?.growthValues ?? { label: 'Crescimento', disabled: true, operation: 'none', cells: [] },
      profitabilityRows?.varValues ?? { label: 'VAR', disabled: true, operation: 'none', cells: [] },
      profitabilityRows?.varPercValues ?? { label: 'VAR%', disabled: true, operation: 'none', cells: [], suffix: '%' },
      profitabilityRows?.aggregatedValues ?? { label: 'Acumulado', disabled: true, operation: 'none', cells: [], suffix: '%' },
      profitabilityRows?.yieldValues ?? { label: 'Yield', disabled: true, operation: 'none', cells: [], suffix: '%' }
    ];
    return {
      title: 'Crescimento',
      months: this.months(),
      rows
    };
  });

  constructor() { }

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

    return Object.values(profitabilities).reduce((rows, { classify, values }) => {
      rows.push({
        label: classify,
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
   * @returns An object containing aggregated transaction data for each category (incomes, contributions, redemptions, withdrawals),
   *          with each category containing a label, operation type, and an array of monthly cell values.
   *
   * The returned structure includes:
   * - `incomes`: Aggregated income transactions (e.g., dividends, IOE returns, rent returns).
   * - `contributions`: Aggregated contribution transactions (e.g., contributions, sells).
   * - `redemptions`: Aggregated redemption transactions.
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
        disabled: false,
        operation: 'plus',
        cells: Array(12).fill(0).map((_, idx) => ({ value: 0, disabled: idx > currentMonth })),
      },
      redemptions: {
        label: 'Resgates',
        disabled: true,
        operation: 'minus',
        cells: Array(12).fill(0).map((_, idx) => ({ value: 0, disabled: idx > currentMonth })),
      },
      withdrawals: {
        label: 'Retiradas',
        disabled: false,
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
          case InvestmentEnum.SELL:
            accIndex = 'contributions';
            break;
          case InvestmentEnum.WITHDRAWAL:
            accIndex = 'withdrawals';
            break;
          case InvestmentEnum.REDEMPTION:
            accIndex = 'redemptions';
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
   * Calculate the contributions to calculate.
   * @param contributions - The contributions to calculate.
   * @returns An array of contribution values for each month.
   */
  private calculateContributions(contributions: { [month: number]: number }): number[] {
    // Implementação existente...
    const values = Array(12).fill(0) as number[];
    if (!contributions) {
      return values;
    }

    Object.entries(contributions).forEach(([month, value]) => {
      values[parseInt(month)] = value;
    });
    return values;
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
    Object.entries(contributions).forEach(([month, value]) => {
      values[parseInt(month)] = value;
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
    const filters = [InvestmentEnum.DIVIDENDS, InvestmentEnum.IOE_RETURN, InvestmentEnum.RENT_RETURN, InvestmentEnum.CONTRIBUTION, InvestmentEnum.SELL, InvestmentEnum.WITHDRAWAL];
    return Object.values(transactions)
      .filter(t => filters.includes(t.type)
        && t.status === TransactionStatus.COMPLETED
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

    const portfoliosMap = groupBy(Object.values(portfolios), (portfolio) => portfolio.classify);

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
   * Calculates various financial metrics (VAR, VAR%, growth, aggregated values, and yield) 
   * based on profitability data and previous year-end value.
   *
   * @param profitabilityByClassRows - An array of `RowData` objects representing profitability data by class.
   * @param previousYearEndValue - The profitability value at the end of the previous year.
   * @returns An object containing the following calculated metrics:
   * - `growthValues`: Growth values for each month.
   * - `varValues`: VAR (Value at Risk) values for each month.
   * - `varPercValues`: VAR% values for each month.
   * - `aggregatedValues`: Aggregated VAR% values for each month.
   * - `yieldValues`: Yield values for each month.
   */
  private calculateVAR(profitabilityByClassRows: RowData[], previousYearEndValue: number) {
    const monthArray = Array(12).fill(0);

    const growthValues = monthArray.slice() as MonthsNumberArray;
    const varValues = monthArray.slice() as MonthsNumberArray;
    const varPercValues = monthArray.slice() as MonthsNumberArray;
    const aggregatedValues = monthArray.slice() as MonthsNumberArray;
    const yieldValues = monthArray.slice() as MonthsNumberArray;

    const profitabilityRows: MonthsNumberArray = profitabilityByClassRows.map(row => this.rowDataToNumberArray(row))
      .reduce((acc, row) => {
        row.forEach((value, month) => {
          acc[month] += value;
        });
        return acc;
      }, Array(12).fill(0)); // Initialize an array of 12 zeros

    if (!profitabilityRows.length) {
      return undefined; // Return undefined if profitabilityRows is not provided
    }

    const aggregatedTransactionsRows = this.aggregatedTransactionsRows();

    const contributionsRows: MonthsNumberArray = this.rowDataToNumberArray(aggregatedTransactionsRows?.contributions); // AM
    const redemptionsRows: MonthsNumberArray = this.rowDataToNumberArray(aggregatedTransactionsRows?.redemptions); // RgM
    const withdrawalsRows: MonthsNumberArray = this.rowDataToNumberArray(aggregatedTransactionsRows?.withdrawals); // RtM
    const incomeRows: MonthsNumberArray = this.rowDataToNumberArray(aggregatedTransactionsRows?.incomes); // PM

    let previousProfitability = previousYearEndValue;
    for (let month = 0; month < 12; month++) {
      const currentProfitability = profitabilityRows[month] || 0;
      const contributions = contributionsRows[month] || 0;
      const redemptions = redemptionsRows[month] || 0;
      const withdrawals = withdrawalsRows[month] || 0;
      const income = incomeRows[month] || 0;

      // Calculate growth for the month
      growthValues[month] = profitabilityRows[month] - previousProfitability;

      // Calculate the VAR value for the month
      varValues[month] = currentProfitability - (previousProfitability + contributions - withdrawals - redemptions - income);

      // Calculate VAR% for the month
      varPercValues[month] = varValues[month] / (previousProfitability + contributions);

      // Calculate the aggregated VAR% for the month
      if (month == 0) {
        aggregatedValues[month] = varPercValues[month];
      }
      else {
        aggregatedValues[month] = (1 + varPercValues[month]) * (1 + aggregatedValues[month - 1]) - 1;
      }

      // Calculate the yield for the month
      yieldValues[month] = (income / currentProfitability) || 0;

      // Update the previousProfitability for the next iteration
      previousProfitability = currentProfitability || 0;
    }

    return {
      growthValues: this.monthNumberArrayToRowData("Crescimento", growthValues),
      varValues: this.monthNumberArrayToRowData("VAR", varValues),
      varPercValues: this.monthNumberArrayToRowData("VAR%", varPercValues),
      aggregatedValues: this.monthNumberArrayToRowData("Acumulado", aggregatedValues),
      yieldValues: this.monthNumberArrayToRowData("Yield", yieldValues),
    };
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
   * @param classify - The classification/category of the profitability data.
   * @param month - The month (0-indexed) for which the profitability value is being updated.
   * @param value - The new profitability value to set for the specified year, classification, and month.
   * @returns A promise or result from the `sourceService.updateProfitability` method, indicating the update status.
   */
  updateProfitability(year: number, classify: string, month: number, value: number) {
    
    const profiltability = this.sourceService.dataSource.profitability();

    if (!profiltability[year]) {
      profiltability[year] = {};
    }
    if (!profiltability[year][classify]) {
      profiltability[year][classify] = Array(12).fill(0);
    }
    profiltability[year][classify][month] = value;
    return this.sourceService.updateProfitability(year, profiltability[year]);
  }

  monthNumberArrayToRowData(label: string, monthNumberArray: MonthsNumberArray): RowData {
    const currentMonth = getMonth(new Date());
    return {
      label,
      disabled: true,
      operation: 'none',
      cells: monthNumberArray.map((value, month) => ({ value, disabled: month > currentMonth })),
    } as RowData;
  }

  months() {
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  }
}