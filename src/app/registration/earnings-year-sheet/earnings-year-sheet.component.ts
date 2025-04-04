import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { endOfYear, format, getMonth, setMonth, startOfYear } from 'date-fns';
import { map } from 'rxjs';
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

  readonly months = new Array(12).fill(0).map((_, i) => format(new Date(0, i), 'MMM'));

  readonly vlMonths = this.months.map((_, idx) => `vl${idx}`);

  data = signal<SheetRow[]>([]);

  queue = signal<EarningEntry[]>([]);

  asset = this.investmentService.assertsSignal();

  readonly displayedColumns = ['ticker', 'acronym', 'vl0', 'vl1', 'vl2', 'vl3', 'vl4', 'vl5', 'vl6', 'vl7', 'vl8', 'vl9', 'vl10', 'vl11'];

  filter = signal<EarningsFilterType>({ dateReference: new Date(), typeReference: null, portfolioReference: null });

  portfoliosAssets = computed(() =>
    Object.values(this.portfolioService.portfolios())
      .filter(portfolio => !this.filter().portfolioReference || portfolio.id === this.filter().portfolioReference)
      .flatMap(portfolio => Object.values(portfolio.allocations)));

  ngOnInit(): void {
    this.doFilter();
  }

  filterChanged(filterEvent: EarningsFilterType) {
    this.filter.set(filterEvent);
    this.doFilter();
  }

  doFilter() {
    const filter = this.filter();

    const enums = Object.values(IncomeEnum);

    let earnings = this.investmentService.findIncomesBetween(startOfYear(filter.dateReference), endOfYear(filter.dateReference))
      .filter(earning => earning.amount > 0)
      .sort((a, b)=> a.ticker.localeCompare(b.ticker) * 1000
        + enums.indexOf(a.type) - enums.indexOf(b.type));

    if (!!filter.typeReference) {
      earnings = this.filterByTypeReference(earnings);
    }

    if (!!filter.portfolioReference) {
      earnings = this.filterByPortfolioAssets(earnings);
    }

    let data: SheetRow[] = this.prepareSheetRows(earnings);

    this.data.set(data);
    this.changeDetectorRef.detectChanges();

  }

  private prepareSheetRows(earnings: { date: Date; id: string; ticker: string; amount: number; type: IncomeEnum; }[]) {
    let data: SheetRow[] = [];
    this.data.set([]);

    earnings.forEach(earning => {
      let mainRowIdx = data.findIndex((row: SheetRow) => row.ticker === earning.ticker && row.main);
      let row = data.find((row: SheetRow) => row.ticker === earning.ticker && row.acronymEarn === EARNING_ACRONYM[earning.type]);
      if (!row) {
        row = this.earningToRow(earning)
        if (mainRowIdx > -1) {
          const mainRow = data[mainRowIdx];
          mainRow.rowspan = (mainRow.rowspan || 1) + 1;
          data.splice(mainRowIdx + 1, 0, row);
        }
        else {
          row.main = true;
          data.push(row);
        }
      }
      this.earningValueToRow(earning, row);
    });
    return data;
  }

  private filterByPortfolioAssets(earnings: { date: Date; id: string; ticker: string; amount: number; type: IncomeEnum; }[]) {
    const portfolioAssets = this.portfoliosAssets().map(asset => getMarketPlaceCode(asset));
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
    return parseFloat(this.data().reduce((acc, row) => acc += row.entries[vlMonth].amount, 0).toFixed(2));
  }

  earningToRow(earning: Income) {
    return {
      ticker: earning.ticker,
      description: this.asset[earning.ticker].name,
      acronymEarn: EARNING_ACRONYM[earning.type],
      rowspan: 1,
      entries: new Array(12).fill(0).map(_ => ({ amount: 0 }))
    } as SheetRow;
  }

  earningValueToRow(earning: Income, row: SheetRow) {
    const month = getMonth(earning.date);
    const data = {
      month,
      ...earning,
      amount: parseFloat(earning.amount.toFixed(2)),
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
      })
    );
  }

  private saveEarning(element: SheetRow, entry: EarningEntry) {
    let [marketPlace, code] = element.ticker.split(':');
    const earnings = this.investmentService.findIncomesOfAsset({ marketPlace, code });

    const earning: Income | undefined = earnings.find(item => item.id === entry.id);

    if (!!earning) {
      if (!entry.amount) {
        this.investmentService.deleteIncome(earning.id);
      }
      else {
        const entryData = { ...earning, ...entry, ticker: element.ticker } as Required<Income>;
        this.investmentService.updateIncome(earning.id, { ...entryData, date: entry.date as Date });
      }
    }
    else {
      const earningTypeFound = Object.entries(EARNING_ACRONYM)
        .map(([key, value]) => ({ key: key as IncomeEnum, value }))
        .find(item => item.value === element.acronymEarn);

      const entryData = { type: earningTypeFound?.key, ...entry, ticker: element.ticker } as Required<Income>;
      if (entry.amount) {
        this.investmentService.addIncome(element.ticker, entryData);
        
        // this.setEarningValue(earning, element);
        this.doFilter();
      }
    }
    this.changeDetectorRef.detectChanges();
  }

  getRowsPan(row: SheetRow) {
    return Object.keys(row.entries).length
  }
}
