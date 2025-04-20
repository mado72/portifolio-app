import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { endOfYear, getMonth, setMonth, startOfYear } from 'date-fns';
import { catchError, map } from 'rxjs';
import { Income, IncomeEnum, IncomeEnumType } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { getMarketPlaceCode } from '../../service/quote.service';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';
import { EarningsEntryDialogComponent } from '../earnings-entry-dialog/earnings-entry-dialog.component';
import { EarningsFilterComponent, EarningsFilterType } from '../earnings-filter/earnings-filter.component';


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

type EarningEntry = {
  id?: string;
  date?: Date;
  type?: IncomeEnum;
  amount: number;
};

type SheetRow = {
  ticker: string;
  description: string;
  main?: boolean;
  rowspan?: number;
  acronymEarn: string;
  entries: EarningEntry[];
}

const EARNING_ACRONYM: Record<IncomeEnumType, string> = {
  "DIVIDENDS": 'DY',
  "RENT_RETURN": 'AL',
  "IOE_RETURN": 'JC',
}

@Component({
  selector: 'app-earnings-year-sheet',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    DecimalPipe,
    DatePipe,
    EarningsFilterComponent
  ],
  providers: [
    provideAppDateAdapter(YEAR_FORMATS)
  ],
  templateUrl: './earnings-year-sheet.component.html',
  styleUrl: './earnings-year-sheet.component.scss'
})
export class EarningsYearSheetComponent implements OnInit {

  private investmentService = inject(InvestmentService);

  private portfolioService = inject(PortfolioService);

  private changeDetectorRef = inject(ChangeDetectorRef);

  private dialog = inject(MatDialog);

  readonly months = Array.from({ length: 12 }, (_, i) => new Date(0, i, 1));

  readonly vlMonths = this.months.map((_, idx) => `vl${idx}`);

  filter = signal<EarningsFilterType>({ dateReference: new Date(), typeReference: null, portfolioReference: null });

  data = computed<SheetRow[]>(()=>this.getData(this.filter()));

  queue = signal<EarningEntry[]>([]);

  asset = this.investmentService.assertsSignal();

  readonly displayedColumns = ['ticker', 'acronym', ...this.months.map((_, idx) => `vl${idx}`)];

  portfoliosAssets = computed(() =>
    Object.values(this.portfolioService.portfolios())
      .filter(portfolio => !this.filter().portfolioReference || portfolio.id === this.filter().portfolioReference)
      .flatMap(portfolio => Object.values(portfolio.allocations))
    );

  ngOnInit(): void {
    this.doFilter();
  }

  filterChanged(filterEvent: EarningsFilterType) {
    this.filter.set({...filterEvent});
  }

  doFilter() {
  }

  getData(filter: EarningsFilterType) {
    let earnings = this.getEarningsFiltered(filter);
    
    return this.prepareSheetRows(earnings);
  }
  
  private getEarningsFiltered(filter: EarningsFilterType) {
    let earnings = this.investmentService.findIncomesBetween(startOfYear(filter.dateReference), endOfYear(filter.dateReference))
      .filter(earning => earning.amount > 0);

    const earningsTicker = new Set(earnings.map(earning=>earning.ticker));
    const enums = Object.values(IncomeEnum);

    earnings = earnings.concat(
      this.portfoliosAssets()
        .map(asset => asset.ticker)
        .filter(ticker=>!earningsTicker.has(ticker))
        .map(ticker=>({
          ticker,
          type: IncomeEnum.DIVIDENDS
        } as Income)))
        .sort((a, b) => {
          const tickerComparison = a.ticker.localeCompare(b.ticker);
          const typeComparison = enums.indexOf(a.type) - enums.indexOf(b.type);
          return tickerComparison !== 0 ? tickerComparison : typeComparison;
        });
      
    if (!!filter.typeReference) {
      earnings = this.filterByTypeReference(earnings);
    }

    if (!!filter.portfolioReference) {
      earnings = this.filterByPortfolioAssets(earnings);
    }
    
    return earnings;
  }

  private prepareSheetRows(earnings: { date: Date; id: string; ticker: string; amount: number; type: IncomeEnum; }[]) {
    let data: SheetRow[] = [];
    const tickerMap = new Map<string, SheetRow>();
    const mainRowMap = new Map<string, number>();

    earnings.forEach(earning => {
      const tickerKey = earning.ticker;
      const acronymKey = `${earning.ticker}-${EARNING_ACRONYM[earning.type]}`;

      let mainRowIdx = mainRowMap.get(tickerKey);
      let row = tickerMap.get(acronymKey);

      if (!row) {
        row = this.earningToRow(earning);
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
      this.earningValueToRow(earning, row);
    });
    return data;
  }

  private filterByPortfolioAssets(earnings: { date: Date; id: string; ticker: string; amount: number; type: IncomeEnum; }[]) {
    const portfolioAssets = this.portfoliosAssets()
      .map(asset => asset.ticker);
    earnings = earnings.filter(earning => portfolioAssets.includes(earning.ticker));
    return earnings;
  }

  private filterByTypeReference(earnings: { date: Date; id: string; ticker: string; amount: number; type: IncomeEnum; }[]) {
    const assets = Object.entries(this.investmentService.assertsSignal())
      .filter(([_, asset]) => asset.type === this.filter().typeReference)
      .map(([ticker, _]) => ticker);
    return earnings.filter(earning => assets.includes(earning.ticker));
  }

  totalMonth(vlMonth: number): number {
    return parseFloat(this.data().reduce((acc, row) => {
      const entry = row.entries[vlMonth];
      return acc + (entry?.amount || 0);
    }, 0).toFixed(2));
  }

  earningToRow(earning: Income) {
    return {
      ticker: earning?.ticker,
      description: this.asset[earning?.ticker]?.name || '',
      acronymEarn: EARNING_ACRONYM[earning?.type] || EARNING_ACRONYM[IncomeEnum.DIVIDENDS],
      rowspan: 1,
      entries: new Array(12).fill(0).map(_ => ({ amount: 0 }))
    } as SheetRow;
  }

  earningValueToRow(earning: Income, row: SheetRow) {
    const month = getMonth(earning.date);
    const data = {
      month,
      ...earning,
      amount: earning.amount && parseFloat(earning.amount.toFixed(2)),
      acronymEarn: EARNING_ACRONYM[earning.type]
    };
    row.entries[month] = data;
  }

  updateEntry($event: any, index: number, element: SheetRow) {
    element.entries[index].date = new Date();
  }

  editCell(index: number, element: SheetRow) {
    const entry = element.entries[index];
    if (!entry.date) {
      entry.date = setMonth(new Date(), index);
    }

    const earningTypeFound = Object.entries(EARNING_ACRONYM)
      .map(([key, value]) => ({ key, value }))
      .find(item => item.value === element.acronymEarn);

    const dialogRef = this.dialog.open(EarningsEntryDialogComponent, {
      data: { entry, type: earningTypeFound?.key, title: 'Cadastro de Provento', disabled: true }
    });

    this.processDialogResults(dialogRef, element).subscribe(earning => {
      if (!earning) return;
      const month = getMonth(earning.date as Date);

      if (month !== index) {
        element.entries[index] = { amount: 0 };
        this.changeDetectorRef.detectChanges();
      }
      element.entries[month] = earning;
    });
  }

  addRow(row: SheetRow) {
    const newRow = {
      ...row,
      main: false,
      entries: new Array(12).fill(0).map(_ => ({ amount: 0 }))
    };

    const dialogRef = this.dialog.open(EarningsEntryDialogComponent, {
      data: { newRow, title: 'Cadastro de Novo Provento' }
    });

    this.processDialogResults(dialogRef, newRow).subscribe(_ => {
      this.doFilter();
    });
  }

  private processDialogResults(dialogRef: MatDialogRef<EarningsEntryDialogComponent, EarningEntry | undefined>, element: SheetRow) {
    return dialogRef.afterClosed().pipe(
      map((result?: EarningEntry) => {
        result && this.saveEarning(element, result);
        return result;
      }),
      catchError(error=>{
        console.error(`Error while processing dialog`, error);
        return [];
      })
    );
  }

  private saveEarning(element: SheetRow, entry: EarningEntry) {
    let [marketPlace, code] = element.ticker.includes(':') 
      ? element.ticker.split(':') 
      : [element.ticker, ''];
    const earnings = this.investmentService.findIncomesOfAsset({ marketPlace, code });

    const earning: Income | undefined = earnings.find(item => item.id === entry.id);

    if (!!earning) {
      if (!entry.amount && earning.id) {
        this.investmentService.deleteIncome(earning.id);
      }
      else if (earning.id) {
        const entryData = { ...earning, ...entry, ticker: element.ticker } as Required<Income>;
        if (entry.date && !isNaN(new Date(entry.date).getTime())) {
          this.investmentService.updateIncome(earning.id, { ...entryData, date: new Date(entry.date) });
        } else {
          console.warn('Invalid date provided for entry:', entry);
        }
      }
    }
    else {
      const earningTypeFound = Object.entries(EARNING_ACRONYM)
        .map(([key, value]) => ({ key: key as IncomeEnum, value }))
        .find(item => item.value === element.acronymEarn);

      const entryData = { type: earningTypeFound?.key, ...entry, ticker: element.ticker } as Required<Income>;
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
