import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { endOfYear, format, getMonth, setMonth, startOfYear } from 'date-fns';
import { firstValueFrom, forkJoin, map, of } from 'rxjs';
import { AssetEnum, Income, IncomeEnum, IncomeEnumType } from '../../model/investment.model';
import { PortfolioAssetsSummary } from '../../model/portfolio.model';
import { InvestmentService } from '../../service/investment.service';
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
  id?: number;
  date?: Date;
  type?: IncomeEnum;
  amount: number;
};

type SheetRow = {
  ticket: string;
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

  private changeDetectorRef = inject(ChangeDetectorRef);

  private dialog = inject(MatDialog);

  readonly months = new Array(12).fill(0).map((_, i) => format(new Date(0, i), 'MMM'));

  readonly vlMonths = this.months.map((_, idx) => `vl${idx}`);

  data = signal<SheetRow[]>([]);

  queue = signal<EarningEntry[]>([]);

  asset = this.investmentService.assertsSignal();

  readonly displayedColumns = ['ticket', 'acronym', 'vl0', 'vl1', 'vl2', 'vl3', 'vl4', 'vl5', 'vl6', 'vl7', 'vl8', 'vl9', 'vl10', 'vl11'];

  filter: EarningsFilterType = { dateReference: new Date(), typeReference: null, portfolioReference: null };

  ngOnInit(): void {
    this.doFilter(this.filter);
  }

  async getPortfoliosSummary() {
    const items = await firstValueFrom(this.investmentService.getPortfolioAssetsSummary());
    return items;
  }

  doFilter(filter?: EarningsFilterType) {
    filter = this.filter = filter || this.filter;
    const joinSetup = {
      earnings: this.investmentService.findIncomesBetween(startOfYear(filter.dateReference), endOfYear(filter.dateReference)),
      portfolios: !!filter.portfolioReference ?
        this.investmentService.getPortfolioAssetsSummary() : of([] as PortfolioAssetsSummary[])
    };

    forkJoin(joinSetup).subscribe(({ earnings, portfolios }) => {
      if (!!filter.typeReference) {
        earnings = this.filterByTypeReference(filter.typeReference, earnings);
      }

      if (!!filter.portfolioReference) {
        earnings = this.filterByPortfolioAssets(filter.portfolioReference, portfolios, earnings);
      }

      // earnings.sort((a, b) => 1000 * (a.date.getTime() - b.date.getTime()) + a.id - b.id);
      let data: SheetRow[] = this.prepareSheetRows(earnings);

      this.data.set(data);
      this.changeDetectorRef.detectChanges();
    });
  }

  private prepareSheetRows(earnings: { date: Date; id: number; ticket: string; amount: number; type: IncomeEnum; }[]) {
    let data: SheetRow[] = [];
    this.data.set([]);

    earnings.forEach(earning => {
      let mainRowIdx = data.findIndex((row: SheetRow) => row.ticket === earning.ticket && row.main);
      let row = data.find((row: SheetRow) => row.ticket === earning.ticket && row.acronymEarn === EARNING_ACRONYM[earning.type]);
      if (!row) {
        row = this.earningToRow(earning)
        if (mainRowIdx > -1) {
          const mainRow = data[mainRowIdx];
          mainRow.rowspan = (mainRow.rowspan || 1) + 1;
          data.splice(mainRowIdx+1, 0, row);
        }
        else {
          row.main = true;
          data.push(row);
        }
      }
      this.setEarningValue(earning, row);
    });
    return data;
  }

  private filterByPortfolioAssets(portfolioReference: string, portfolios: PortfolioAssetsSummary[], earnings: { date: Date; id: number; ticket: string; amount: number; type: IncomeEnum; }[]) {
    const assets = portfolios.find(item => item.id === portfolioReference)?.assets || [];
    earnings = earnings.filter(earning => assets.includes(earning.ticket));
    return earnings;
  }

  private filterByTypeReference(typeReference: AssetEnum, earnings: { date: Date; id: number; ticket: string; amount: number; type: IncomeEnum; }[]) {
    const assets = Object.entries(this.investmentService.assertsSignal())
      .filter(([_, asset]) => asset.type === typeReference)
      .map(([ticket, _]) => ticket);
    return earnings.filter(earning => assets.includes(earning.ticket));
  }

  totalMonth(vlMonth: number): number {
    return parseFloat(this.data().reduce((acc, row) => acc += row.entries[vlMonth].amount, 0).toFixed(2));
  }

  earningToRow(earning: Income) {
    return {
      ticket: earning.ticket,
      description: this.asset[earning.ticket].name,
      acronymEarn: EARNING_ACRONYM[earning.type],
      rowspan: 1,
      entries: new Array(12).fill(0).map(_ => ({ amount: 0 }))
    } as SheetRow;
  }

  setEarningValue(earning: Income, row: SheetRow) {
    const month = getMonth(earning.date);
    const data = {
      id: earning.id,
      amount: parseFloat(earning.amount.toFixed(2)),
      acronymEarn: EARNING_ACRONYM[earning.type],
      date: earning.date
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

    this.processDialogResults(dialogRef, newRow).subscribe(_=>{
      this.doFilter(this.filter);
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
    let [marketPlace, code] = element.ticket.split(':');
    this.investmentService.findIncomesOfAsset({ marketPlace, code }).subscribe(earnings => {
      const earning: Income | undefined = earnings.find(item => item.id === entry.id);

      if (!!earning) {
        if (!entry.amount) {
          this.investmentService.deleteIncome(earning.id).subscribe();
        }
        else {
          const entryData = { ...earning, ...entry, ticket: element.ticket } as Required<Income>;
          this.investmentService.updateIncome(earning.id, { ...entryData, date: entry.date as Date }).subscribe();
        }
      }
      else {
        const earningTypeFound = Object.entries(EARNING_ACRONYM)
          .map(([key, value]) => ({ key: key as IncomeEnum, value }))
          .find(item => item.value === element.acronymEarn);
          
        const entryData = { type: earningTypeFound?.key, ...entry, ticket: element.ticket } as Required<Income>;
        if (entry.amount) {
          this.investmentService.addIncome(element.ticket, entryData).subscribe(() => {
            // this.setEarningValue(earning, element);
            this.doFilter(this.filter);
          });
        }
      }
      this.changeDetectorRef.detectChanges();
    });
  }

  getRowsPan(row: SheetRow) {
    return Object.keys(row.entries).length
  }
}
