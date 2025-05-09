import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { endOfYear, getMonth, isWithinInterval, startOfYear } from 'date-fns';
import { Currency } from '../../model/domain.model';
import { ExchangeStructureType, IncomeEnum, InvestmentEnum } from '../../model/investment.model';
import { InvestmentTransactionType, Ticker } from '../../model/source.model';
import { AssetService } from '../../service/asset.service';
import { ExchangeService } from '../../service/exchange.service';
import { PortfolioService } from '../../service/portfolio-service';
import { TransactionService } from '../../service/transaction.service';
import { ExchangeComponent } from '../../utils/component/exchange/exchange.component';
import { TrGroupComponent } from '../../utils/component/tr-group/tr-group.component';
import { AddTransactionButtonComponent } from '../add-transaction-button/add-transaction-button.component';
import { IncomeFilterType, IncomeYearSheetFilterComponent } from '../income-year-sheet-filter/income-year-sheet-filter.component';

type IncomeEntry = {
  id?: string;
  date?: Date;
  amount: ExchangeStructureType;
};

type SheetRow = {
  ticker: string;
  description: string;
  main?: boolean;
  rowspan?: number;
  acronymEarn: string;
  entries: IncomeEntry[];
}

const EARNING_ACRONYM: Partial<Record<InvestmentEnum, string>> = {
  "DIVIDENDS": 'DY',
  "RENT_RETURN": 'AL',
  "IOE_RETURN": 'JC',
};

@Component({
  selector: 'app-income-year-sheet',
  standalone: true,
  imports: [
    DatePipe,
    IncomeYearSheetFilterComponent,
    AddTransactionButtonComponent,
    TrGroupComponent,
    ExchangeComponent
  ],
  templateUrl: './income-year-sheet.component.html',
  styleUrl: './income-year-sheet.component.scss',
})
export class IncomeYearSheetComponent {

  private transactionService = inject(TransactionService);

  private exchangeService = inject(ExchangeService);

  private assetService = inject(AssetService);

  private portfolioService = inject(PortfolioService);

  private router = inject(Router);

  readonly months = Array.from({ length: 12 }, (_, i) => new Date(0, i, 1));

  readonly vlMonths = this.months.map((_, idx) => `vl${idx}`);

  filter = signal<IncomeFilterType>({
    tickerReference: null,
    dateReference: new Date(),
    typeReference: null,
    portfolioReference: null,
    currencyReference: null, // Adicionado o filtro por moeda
  });

  queue = signal<IncomeEntry[]>([]);

  assets = this.assetService.assets;

  exchangeView = this.exchangeService.exchangeView;

  currencyDefault = this.exchangeService.currencyDefault;

  incomesFiltered = computed(() => {
    const incomeTypes = [InvestmentEnum.DIVIDENDS, InvestmentEnum.RENT_RETURN, InvestmentEnum.IOE_RETURN];
    const filter = this.filter();
    const incomes = Object.entries(this.transactionService.investmentTransactions())
      .filter(([_, item]) => 
        incomeTypes.includes(item.type) 
        && (!filter.tickerReference || item.ticker.indexOf(filter.tickerReference.toLocaleUpperCase()) !== -1)
        && isWithinInterval(item.date, { start: startOfYear(filter.dateReference), end: endOfYear(filter.dateReference) }))
      .sort(([_A, transactionA], [_B, transactionB]) => transactionA.ticker.localeCompare(transactionB.ticker)) // Sort by ticker
      .reduce((acc, [_, item]) => {
        if (!acc[item.ticker]) {
          acc[item.ticker] = [];
        }
        acc[item.ticker].push(item);
        return acc;
      }, {} as { [ticker: string]: InvestmentTransactionType[] });

    return this.getIncomesFiltered(filter, incomes);
  });

  data = computed<SheetRow[]>(() => this.getData(
    Object.values(this.incomesFiltered()).flatMap(incomes => incomes)));

  readonly displayedColumns = ['ticker', 'acronym', ...this.months.map((_, idx) => `vl${idx}`)];

  filterChanged(filterEvent: IncomeFilterType) {
    this.filter.set({ ...filterEvent });
  }

  getData(incomes: InvestmentTransactionType[]) {
    return this.prepareSheetRows(this.exchangeService.currencyDefault(), incomes);
  }

  private getIncomesFiltered(filter: IncomeFilterType, incomes: { [ticker: string]: InvestmentTransactionType[]; }) {
    const assets = Object.values(this.assets())
      .filter(asset => 
        (!filter.typeReference || asset.type === filter.typeReference) &&
        (!filter.currencyReference || asset.quote.currency === filter.currencyReference) // Filtra pela moeda
      )
      .map(asset => asset.ticker);

    const tickers = !filter.portfolioReference ? assets
      : Object.values(this.portfolioService.portfolios())
        .filter(portfolio => portfolio.id === filter.portfolioReference)
        .flatMap(portfolio => Object.values(portfolio.allocations))
        .filter(alloc => !filter.typeReference || assets.includes(alloc.data.ticker))
        .map(alloc => alloc.data.ticker);

    const incomesTicker = Object.entries(incomes).reduce((acc, [_, incomes]) => {
      incomes = incomes.filter(income => tickers.includes(income.ticker));
      if (incomes.length === 0) {
        return acc;
      }

      acc[incomes[0].ticker] = incomes;
      return acc;
    }, {} as { [ticker: string]: InvestmentTransactionType[] });

    return incomesTicker;
  }

  private prepareSheetRows(currencyDefault: Currency, incomes: InvestmentTransactionType[]) {
    let data: SheetRow[] = [];
    const tickerMap = new Map<string, SheetRow>();
    const mainRowMap = new Map<string, number>();

    incomes.forEach(income => {
      const tickerKey = income.ticker;
      const acronymKey = `${income.ticker}-${EARNING_ACRONYM[income.type]}`;

      let mainRowIdx = mainRowMap.get(tickerKey);
      let row = tickerMap.get(acronymKey);

      if (!row) {
        row = this.createRow(income.ticker, income.type, income.value.currency, currencyDefault);
        tickerMap.set(acronymKey, row);

        if (mainRowIdx !== undefined) {
          const mainRow = data[mainRowIdx];
          mainRow.rowspan = (mainRow.rowspan || 1) + 1;
          data.splice(mainRowIdx + 1, 0, row);
        } else {
          row.main = true;
          mainRowMap.set(tickerKey, data.length);
          data.push(row);
        }
      }
      this.incomeValueToRow(income, row);
    });
    return data;
  }

  totalMonth(vlMonth: number): ExchangeStructureType {
    const total = this.data().reduce((sum, row) => {
      const entry = row.entries[vlMonth];
      return sum + entry.amount.exchanged.value;
    }, 0);
    return {
      original: {
        currency: this.currencyDefault(),
        value: total
      },
      exchanged: {
        currency: this.currencyDefault(),
        value: total
      }
    }
  }

  totalOverall(): ExchangeStructureType {
    const total = this.data().reduce((sum, row) => {
      return sum + row.entries.reduce((rowSum, entry) => {
        return rowSum + (entry?.amount?.exchanged?.value || 0);
      }, 0);
    }, 0);

    return {
      original: {
        currency: this.currencyDefault(),
        value: total
      },
      exchanged: {
        currency: this.currencyDefault(),
        value: total
      }
    };
  }

  getTotalByRow(row: SheetRow): ExchangeStructureType {
    const asset = this.assets()[row.ticker];
    const total = row.entries.reduce((sum, entry) => {
      return sum + (entry?.amount?.exchanged?.value || 0);
    }, 0);

    return this.exchangeService.updateExchange({
      original: { currency: asset.quote.currency, value: total },
      exchanged: { currency: this.exchangeService.currencyDefault(), value: 0 }
    } as ExchangeStructureType);
  }

  createRow(ticker: Ticker, assetType: InvestmentEnum, assetCurrency: Currency, currencyDefault: Currency): SheetRow {
    return {
      ticker,
      description: this.assets()[ticker]?.name || '',
      acronymEarn: EARNING_ACRONYM[assetType] || EARNING_ACRONYM[IncomeEnum.DIVIDENDS],
      rowspan: 1,
      entries: new Array(12).fill(0).map(_ => ({ 
        amount: {
          original: {currency: assetCurrency, value: 0},
          exchanged: {currency: currencyDefault, value: 0}
        } 
      }))
    } as SheetRow;
  }

  incomeValueToRow(income: InvestmentTransactionType, row: SheetRow) {
    const month = getMonth(income.date);
    const cellData = {
      month,
      ...income,
      amount: this.exchangeService.updateExchange({
        original: { currency: income.value.currency, value: income.value.value + (row.entries[month]?.amount?.original?.value || 0) },
        exchanged: { currency: this.exchangeService.currencyDefault(), value: 0 }
      } as ExchangeStructureType),
      acronymEarn: EARNING_ACRONYM[income.type]
    };
    row.entries[month] = cellData;
  }

  editCell(monthIndex: number, element: any) {
    const currentYear = new Date().getFullYear(); // Obtém o ano corrente
    const startOfMonth = new Date(currentYear, monthIndex, 1); // Define o início do mês com o ano corrente
    const endOfMonth = new Date(currentYear, monthIndex + 1, 0); // Define o fim do mês com o ano corrente

    this.router.navigate(['investment', 'incomes', 'transactions'], {
      queryParams: {
        investmentType: element.type, // Tipo correspondente
        ticker: element.ticker, // Código do ativo
        start: startOfMonth.toISOString(), // Data inicial do mês
        end: endOfMonth.toISOString() // Data final do mês
      }
    });
  }

  getRowsPan(row: SheetRow) {
    return Object.keys(row.entries).length
  }
}
