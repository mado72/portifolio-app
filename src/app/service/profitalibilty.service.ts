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
import { CellData, RowData } from '../utils/component/financial-grid/financial-gird.model';
import { Currency } from '../model/domain.model';

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

  profitabilityByClassRows = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return []
    }

    const profitabilityByClass = this.calculateProfitability(
      this.portfolioService.portfolios(), this.sourceService.dataSource.profitability());
    return this.convertProfitabilityByClassToRowData(profitabilityByClass, this.currentMonthProfitability());
  });

  withdraw = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return []
    }
    const currentYear = getYear(new Date());
    const withdraw = this.sourceService.dataSource.withdraw()[currentYear];
    const values = Array(12).fill(0) as number[];
    if (!withdraw) {
      return values;
    }

    Object.entries(withdraw).forEach(([month, value]) => {
      values[parseInt(month)] = value;
    });
    return values;
  });

  incomeWithdrawTransactionRows = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return []
    }

    const incomeWithdrawTransactions = this.calculateIncomesWithdrawsTransactionsByMonth(this.transactionService.investmentTransactions());
    return this.convertIncomeWithdrawTransactionsToRowData(incomeWithdrawTransactions, this.exchangeService.currencyDefault());
  });

  financialGridData = computed(() => {
    return {
      title: 'Rendimentos e Resgates',
      months: this.months(),
      rows: this.profitabilityByClassRows().concat(
        this.incomeWithdrawTransactionRows())
    };
  });

  constructor() { }

  private convertProfitabilityByClassToRowData(profitabilities: ProfitabilityByClass[], currentMonthProfitability: Record<string, number>) {
    const currentMonth = getMonth(new Date());
    
    return Object.values(profitabilities).reduce((rows, {classify, values}) => {
      rows.push({
        label: classify,
        disabled: false,
        operation: 'plus',
        cells: values.reduce((acc, value, index) => {
          acc.push({ value: index >= currentMonth ? currentMonthProfitability[classify] || 0 : value, disabled: index > currentMonth });
          return acc;
        }, [] as CellData[])
      });
      return rows;
    }, [] as RowData[]);
  }

  private convertIncomeWithdrawTransactionsToRowData(incomesWithdraw: { [month: number]: InvestmentTransactionType[]; }, currencyDefault: Currency) {

    const currentMonth = getMonth(new Date());

    return Object.entries(incomesWithdraw).reduce((acc, [month, investments]) => {
      investments.forEach((investment) => {
        const accIdx = InvestmentEnum.SELL === investment.type ? 1 : 0;
        const value = this.exchangeService.exchange(investment.value.value, investment.value.currency, currencyDefault).value;
        const cell = acc[accIdx].cells[Number(month) % 12];
        if (cell && cell.value !== undefined) {
          cell.value = (cell.value || 0) + value;
        }
      });

      return acc;
    }, [{
      label: 'Proventos',
      disabled: false,
      operation: 'plus',
      cells: Array(12).fill(0).map(() => ({ value: 0, disabled: true })),
    }, {
      label: 'Resgate',
      disabled: false,
      operation: 'minus',
      cells: Array(12).fill(0).map((_,idx) => ({ value: 0, disabled: idx > currentMonth })),
    }] as RowData[]).map(row => {
      row.cells.forEach(cell=>cell.value = Math.round((cell.value || 0) * 100) / 100);
      return row;
    });
  }

  private calculateIncomesWithdrawsTransactionsByMonth(transactions: Record<string, InvestmentTransactionType>): { [month: number]: InvestmentTransactionType[]; } {
    return Object.values(transactions)
      .filter(t => [InvestmentEnum.DIVIDENDS, InvestmentEnum.IOE_RETURN, InvestmentEnum.RENT_RETURN, InvestmentEnum.SELL].includes(t.type)
        && t.status === TransactionStatus.COMPLETED
        && getYear(t.date) === getYear(new Date()))
      .reduce((acc, t) => {
        const month = new Date(t.date).getMonth();
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(t);
        return acc;
      }, {} as { [month: number]: InvestmentTransactionType[]; });
  }

  private getCurrentMonthProfitability(portfolios: PortfolioRecord) {
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

  private calculateProfitability(portfolios: PortfolioRecord, source: Record<number, Record<string, number[]>>) {
    if (!this.sourceService.dataIsLoaded()) {
      return [];
    }
    const currentMonth = getMonth(new Date());
    const currentYear = getYear(new Date());
    const currentYearProfitability = source[currentYear];
    const current = this.getCurrentMonthProfitability(portfolios);

    Object.entries(current).forEach(([classify, value]) => {
      currentYearProfitability[classify][currentMonth] = value;
    });

    return Object.entries(currentYearProfitability).map(([classify, values]) => ({
      classify,
      values
    } as ProfitabilityByClass));
  }

  months() {
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  }

}
