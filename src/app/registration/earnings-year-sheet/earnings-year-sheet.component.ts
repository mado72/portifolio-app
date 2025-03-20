import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { endOfYear, format, getMonth, setMonth, startOfYear } from 'date-fns';
import { firstValueFrom, forkJoin, of, timer } from 'rxjs';
import { AssetEnum, Earning, EarningsEnum, EarningsEnumType } from '../../model/investment.model';
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
  type?: EarningsEnum;
  amount: number;
};

type SheetRow = {
  ticket: string;
  description: string;
  rowspan?: number;
  acronym: string;
  entries: EarningEntry[];
}

const EARNING_ACRONYM: Record<EarningsEnumType, string> = {
  "DIVIDENDS": 'DY',
  "RENT_RETURN": 'AL',
  "IOE_RETURN": 'JC',
}

@Component({
  selector: 'app-earnings-year-sheet',
  standalone: true,
  imports: [
    MatTableModule,
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

  filter: EarningsFilterType = {dateReference: new Date(), typeReference: null, portfolioReference: null};

  ngOnInit(): void {
    this.filter = this.doFilter(this.filter);
  }

  createGroup(earning: Earning): SheetRow[] {
    let rows = Object.values(EARNING_ACRONYM).map(acronym => ({
      ticket: earning.ticket,
      description: this.asset[earning.ticket].name,
      acronym,
      entries: new Array(12).fill(0).map(_ => ({ amount: 0 }))
    } as SheetRow))

    const idx = Object.keys(EARNING_ACRONYM).indexOf(earning.type);

    this.setEarningValue(earning, rows[idx]);
    return rows;
  }

  setEarningValue(earning: Earning, row: SheetRow) {
    const month = getMonth(earning.date);
    const data = {
      id: earning.id,
      amount: parseFloat(earning.amount.toFixed(2)),
      acronym: EARNING_ACRONYM[earning.type],
      date: earning.date
    };
    row.entries[month] = data;
  }

  async getPortfoliosSummary() {
    const items = await firstValueFrom(this.investmentService.getPortfolioAssetsSummary());
    return items;
  }

  doFilter(filter: EarningsFilterType) {
    const joinSetup = {
      earnings: this.investmentService.findEarningsBetween(startOfYear(filter.dateReference), endOfYear(filter.dateReference)),
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

      earnings.sort((a, b) => 1000 * (a.date.getTime() - b.date.getTime()) + a.id - b.id);
      let data: SheetRow[] = this.prepareSheetRows(earnings);

      this.data.set(data);
      this.changeDetectorRef.detectChanges();
    });
    return filter;
  }

  private prepareSheetRows(earnings: { date: Date; id: number; ticket: string; amount: number; type: EarningsEnum; }[]) {
    let data: SheetRow[] = [];
    this.data.set([]);

    earnings.forEach(earning => {
      let group = data.find((row: SheetRow) => row.ticket === earning.ticket);
      if (!group) {
        data = data.concat(this.createGroup(earning));
      }
      else {
        this.setEarningValue(earning, group);
      }
    });
    return data;
  }

  private filterByPortfolioAssets(portfolioReference: string, portfolios: PortfolioAssetsSummary[], earnings: { date: Date; id: number; ticket: string; amount: number; type: EarningsEnum; }[]) {
    const assets = portfolios.find(item => item.id === portfolioReference)?.assets || [];
    earnings = earnings.filter(earning => assets.includes(earning.ticket));
    return earnings;
  }

  private filterByTypeReference(typeReference: AssetEnum, earnings: { date: Date; id: number; ticket: string; amount: number; type: EarningsEnum; }[]) {
    const assets = Object.entries(this.investmentService.assertsSignal())
      .filter(([_, asset]) => asset.type === typeReference)
      .map(([ticket, _]) => ticket);
    return earnings.filter(earning => assets.includes(earning.ticket));
  }

  updateEntry($event: any, index: number, element: SheetRow) {
    element.entries[index].date = new Date();
  }

  totalMonth(vlMonth: number): number {
    return parseFloat(this.data().reduce((acc, row) => acc += row.entries[vlMonth].amount, 0).toFixed(2));
  }

  openDialog(index: number, acronym: string, element: SheetRow) {
    const entry = element.entries[index];
    if (!entry.date) {
      entry.date = setMonth(new Date(), index);
    }

    const earningTypeFound = Object.entries(EARNING_ACRONYM)
      .map(([key, value]) => ({ key, value }))
      .find(item => item.value === acronym);

    const dialogRef = this.dialog.open(EarningsEntryDialogComponent, {
      data: { entry, type: earningTypeFound?.key, title: 'Cadastro de Provento' }
    });

    dialogRef.afterClosed().subscribe((result: EarningEntry) => {
      if (result) {
        element.entries[index] = result;
        this.changeDetectorRef.detectChanges();

        if (this.queue().length == 0) {

          timer(1000).subscribe(() => {
            this.queue().forEach(entry => {
              this.queue().shift();

              this.saveEarning(element, entry);
            })
          })

        }
        this.queue().push(result);
      }
    });
  }

  private saveEarning(element: SheetRow, entry: EarningEntry) {
    let [marketPlace, code] = element.ticket.split(':');
    this.investmentService.findEarningsOfAsset({ marketPlace, code }).subscribe(earnings => {
      const earning: Earning | undefined = earnings.find(item => item.id === entry.id);
      if (!!earning) {
        const entryData = { ...earning, ...entry, ticket: element.ticket } as Required<Earning>;
        this.investmentService.updateEarning(earning.id, { ...entryData, date: entry.date as Date }).subscribe();
      }
      else {
        const entryData = { ...entry, ticket: element.ticket } as Required<Earning>;
        this.investmentService.addEarning(element.ticket, entryData).subscribe(() => {
          // this.setEarningValue(earning, element);
          this.filter = this.doFilter(this.filter);
        });
      }
      this.changeDetectorRef.detectChanges();
    });
  }

  getRowsPan(row: SheetRow) {
    return Object.keys(row.entries).length
  }
}
