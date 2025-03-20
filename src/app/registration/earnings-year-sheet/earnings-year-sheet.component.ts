import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { endOfYear, format, getMonth, setMonth, startOfYear } from 'date-fns';
import { timer } from 'rxjs';
import { AssetEnum, Earning, EarningsEnum, EarningsEnumType } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';
import { AssetTypePipe } from '../../utils/asset-type.pipe';
import { EarningsEntryDialogComponent } from '../earnings-entry-dialog/earnings-entry-dialog.component';


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

const EARNING_ACRONYM : Record<EarningsEnumType, string> = {
  "DIVIDENDS": 'DY',
  "RENT_RETURN": 'AL',
  "IOE_RETURN": 'JC',
}

@Component({
  selector: 'app-earnings-year-sheet',
  standalone: true,
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    AssetTypePipe,
    FormsModule,
    DecimalPipe
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

  filter : { dateReference: Date, typeReference: AssetEnum | null }= {
    dateReference : new Date(),
    typeReference: null
  }

  readonly months = new Array(12).fill(0).map((_, i) => format(new Date(0, i), 'MMM'));

  readonly vlMonths = this.months.map((_, idx) => `vl${idx}`);

  data = signal<SheetRow[]>([]);

  queue = signal<EarningEntry[]>([]);

  asset = this.investmentService.assertsSignal();

  readonly displayedColumns = ['ticket', 'acronym', 'vl0', 'vl1', 'vl2', 'vl3', 'vl4', 'vl5', 'vl6', 'vl7', 'vl8', 'vl9', 'vl10', 'vl11'];

  readonly assetTypes = Object.values(AssetEnum);

  readonly earningTypes = Object.values(EarningsEnum);

  readonly DIVIDENDS = EarningsEnum.DIVIDENDS;

  ngOnInit(): void {
    this.doFilter();
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

  doFilter(): void {
    this.investmentService.findEarningsBetween(startOfYear(this.filter.dateReference), endOfYear(this.filter.dateReference))
      .subscribe(earnings => {
        if (!! this.filter.typeReference) {
          const assets = Object.entries(this.investmentService.assertsSignal())
            .filter(([ticket, asset])=>asset.type === this.filter.typeReference)
            .map(([ticket, _])=>ticket)
          earnings = earnings.filter(earning => assets.includes(earning.ticket));
        }
        earnings.sort((a, b) => 1000 * (a.date.getTime() - b.date.getTime()) + a.id - b.id)
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

        this.data.set(data);
        this.changeDetectorRef.detectChanges();
      });
  }

  choosenYear(d: Date, picker: MatDatepicker<any>): void {
    this.filter.dateReference = d;
    picker.close();
    this.data.set([]);
    this.doFilter();
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
        .map(([key, value]) => ({key, value}))
        .find(item => item.value === acronym);

    const dialogRef = this.dialog.open(EarningsEntryDialogComponent, {
      data: {entry, type: earningTypeFound?.key, title: 'Cadastro de Provento'}
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
      }});
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
          this.doFilter();
        });
      }
      this.changeDetectorRef.detectChanges();
    });
  }

  getRowsPan(row: SheetRow) {
    return Object.keys(row.entries).length
  }
}
