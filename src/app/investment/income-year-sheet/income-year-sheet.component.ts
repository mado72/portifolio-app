import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { endOfYear, getMonth, isWithinInterval, startOfYear } from 'date-fns';
import { Income, IncomeEnum, IncomeEnumType, InvestmentEnum } from '../../model/investment.model';
import { InvestmentTransactionType } from '../../model/source.model';
import { AssetService } from '../../service/asset.service';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { TransactionService } from '../../service/transaction.service';
import { IncomeFilterType, IncomeYearSheetFilterComponent } from '../income-year-sheet-filter/income-year-sheet-filter.component';

const YEAR_FORMATS = {
  parse: {
    dateInput: 'yyyy',
  },
  display: {
    dateInput: 'yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

type IncomeEntry = {
  id?: string;
  date?: Date;
  amount: number;
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
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    DecimalPipe,
    DatePipe,
    IncomeYearSheetFilterComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    provideNativeDateAdapter(YEAR_FORMATS)
  ],
  templateUrl: './income-year-sheet.component.html',
  styleUrl: './income-year-sheet.component.scss'
})
export class IncomeYearSheetComponent {

  private transactionService = inject(TransactionService);

  private investmentService = inject(InvestmentService);

  private assetService = inject(AssetService);

  private portfolioService = inject(PortfolioService);

  private changeDetectorRef = inject(ChangeDetectorRef);

  private dialog = inject(MatDialog);

  readonly months = Array.from({ length: 12 }, (_, i) => new Date(0, i, 1));

  readonly vlMonths = this.months.map((_, idx) => `vl${idx}`);

  filter = signal<IncomeFilterType>({ dateReference: new Date(), typeReference: null, portfolioReference: null });

  queue = signal<IncomeEntry[]>([]);

  assets = this.assetService.assets;

  incomesFiltered = computed(() => {
    const incomes = Object.entries(this.transactionService.investmentTransactions())
      .filter(([_, item]) => isWithinInterval(item.date, { start: startOfYear(this.filter().dateReference), end: endOfYear(this.filter().dateReference) }))
      .sort(([_A, transactionA], [_B, transactionB]) => transactionA.ticker.localeCompare(transactionB.ticker)) // Sort by ticker
      .reduce((acc, [_, item]) => {
        if (!acc[item.ticker]) {
          acc[item.ticker] = [];
        }
        acc[item.ticker].push(item);
        return acc;
      }, {} as { [ticker: string]: InvestmentTransactionType[] });

    return this.getIncomesFiltered(this.filter(), incomes);
  });

  data = computed<SheetRow[]>(() => this.getData(Object.values(this.incomesFiltered()).flatMap(incomes => incomes)));

  readonly displayedColumns = ['ticker', 'acronym', ...this.months.map((_, idx) => `vl${idx}`)];

  filterChanged(filterEvent: IncomeFilterType) {
    this.filter.set({ ...filterEvent });
  }

  getData(incomes: InvestmentTransactionType[]) {
    return this.prepareSheetRows(incomes);
  }

  private getIncomesFiltered(filter: IncomeFilterType, incomes: { [ticker: string]: InvestmentTransactionType[]; }) {
    const assets = Object.values(this.assets())
      .filter(asset => !filter.typeReference || asset.type === filter.typeReference)
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

  private prepareSheetRows(incomes: InvestmentTransactionType[]) {
    let data: SheetRow[] = [];
    const tickerMap = new Map<string, SheetRow>();
    const mainRowMap = new Map<string, number>();

    incomes.forEach(income => {
      const tickerKey = income.ticker;
      const acronymKey = `${income.ticker}-${EARNING_ACRONYM[income.type]}`;

      let mainRowIdx = mainRowMap.get(tickerKey);
      let row = tickerMap.get(acronymKey);

      if (!row) {
        row = this.incomeToRow(income);
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

  totalMonth(vlMonth: number): number {
    return parseFloat(this.data().reduce((acc, row) => {
      const entry = row.entries[vlMonth];
      return acc + (entry?.amount || 0);
    }, 0).toFixed(2));
  }

  incomeToRow(income: InvestmentTransactionType) {
    return {
      ticker: income?.ticker,
      description: this.assets()[income?.ticker]?.name || '',
      acronymEarn: EARNING_ACRONYM[income?.type] || EARNING_ACRONYM[IncomeEnum.DIVIDENDS],
      rowspan: 1,
      entries: new Array(12).fill(0).map(_ => ({ amount: 0 }))
    } as SheetRow;
  }

  incomeValueToRow(income: InvestmentTransactionType, row: SheetRow) {
    const month = getMonth(income.date);
    const data = {
      month,
      ...income,
      amount: parseFloat(income.value.value.toFixed(2)),
      acronymEarn: EARNING_ACRONYM[income.type]
    };
    row.entries[month] = data;
  }

  updateEntry($event: any, index: number, element: SheetRow) {
    element.entries[index].date = new Date();
  }

  addTransaction() {
    this.transactionService.createTransaction();
  }

  editCell(index: number, element: SheetRow) {
    // const entry = element.entries[index];
    // if (!entry.date) {
    //   entry.date = setMonth(new Date(), index);
    // }

    // const incomeTypeFound = Object.entries(EARNING_ACRONYM)
    //   .map(([key, value]) => ({ key, value }))
    //   .find(item => item.value === element.acronymEarn);

    // const dialogRef = this.dialog.open(IncomesEntryDialogComponent, {
    //   data: { entry, type: incomeTypeFound?.key, title: 'Cadastro de Provento', disabled: true }
    // });

    // this.processDialogResults(dialogRef, element).subscribe(income => {
    //   if (!income) return;
    //   const month = getMonth(income.date as Date);

    //   if (month !== index) {
    //     element.entries[index] = { amount: 0 };
    //     this.changeDetectorRef.detectChanges();
    //   }
    //   element.entries[month] = income;
    // });
  }

  addRow(row: SheetRow) {
    // const newRow = {
    //   ...row,
    //   main: false,
    //   entries: new Array(12).fill(0).map(_ => ({ amount: 0 }))
    // };

    // const dialogRef = this.dialog.open(IncomesEntryDialogComponent, {
    //   data: { newRow, title: 'Cadastro de Novo Provento' }
    // });

    // this.processDialogResults(dialogRef, newRow).subscribe(_ => {
    //   this.doFilter();
    // });
  }

  // private processDialogResults(dialogRef: MatDialogRef<IncomesEntryDialogComponent, IncomeEntry | undefined>, element: SheetRow) {
  //   return dialogRef.afterClosed().pipe(
  //     map((result?: IncomeEntry) => {
  //       result && this.saveIncome(element, result);
  //       return result;
  //     }),
  //     catchError(error => {
  //       console.error(`Error while processing dialog`, error);
  //       return [];
  //     })
  //   );
  // }

  private saveIncome(element: SheetRow, entry: IncomeEntry) {
    let [marketPlace, code] = element.ticker.includes(':')
      ? element.ticker.split(':')
      : [element.ticker, ''];
    const incomes = this.investmentService.findIncomesOfAsset({ marketPlace, code });

    const income: Income | undefined = incomes.find(item => item.id === entry.id);

    if (!!income) {
      if (!entry.amount && income.id) {
        this.investmentService.deleteIncome(income.id);
      }
      else if (income.id) {
        const entryData = { ...income, ...entry, ticker: element.ticker } as Required<Income>;
        if (entry.date && !isNaN(new Date(entry.date).getTime())) {
          this.investmentService.updateIncome(income.id, { ...entryData, date: new Date(entry.date) });
        } else {
          console.warn('Invalid date provided for entry:', entry);
        }
      }
    }
    else {
      const incomeTypeFound = Object.entries(EARNING_ACRONYM)
        .map(([key, value]) => ({ key: key as IncomeEnum, value }))
        .find(item => item.value === element.acronymEarn);

      const entryData = { type: incomeTypeFound?.key, ...entry, ticker: element.ticker } as Required<Income>;
      if (entry.amount && entryData.type && entryData.ticker && entryData.date && !isNaN(new Date(entryData.date).getTime())) {
        this.investmentService.addIncome(element.ticker, entryData);

        this.changeDetectorRef.detectChanges();
      }
    }
  }

  getRowsPan(row: SheetRow) {
    return Object.keys(row.entries).length
  }
}
