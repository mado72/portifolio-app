import { DecimalPipe, JsonPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { endOfYear, format, getMonth, startOfYear } from 'date-fns';
import { Earning } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';
import { EditableNumberComponent } from '../../utils/editable-number/editable-number.component';


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
  amount: number;
};

type SheetRow = {
  ticket: string;
  description: string;
  entries: EarningEntry[];
}

@Component({
  selector: 'app-earnings-year-sheet',
  standalone: true,
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    EditableNumberComponent,
    DecimalPipe,
    JsonPipe
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

  dateReference = new Date();

  readonly months = new Array(12).fill(0).map((_, i) => format(new Date(0, i), 'MMM'));
  readonly vlMonths = new Array(12).fill(0).map((_, i) => `vl${i}`);

  data = signal<SheetRow[]>([]);

  asset = this.investmentService.assertsSignal();

  readonly displayedColumns = ['ticket', 'description', 'vl0', 'vl1', 'vl2', 'vl3', 'vl4', 'vl5', 'vl6', 'vl7', 'vl8', 'vl9', 'vl10', 'vl11'];

  ngOnInit(): void {
    this.doFilter();
  }

  createGroup(earning: Earning): SheetRow {
    let itemData: SheetRow = {
      ticket: earning.ticket,
      description: this.asset[earning.ticket].name,
      entries: new Array(12).fill(0).map(_ => ({ amount: 0 }))
    };

    this.setEarningValue(earning, itemData);
    return itemData;
  }

  setEarningValue(earning: Earning, row: SheetRow) {
    const month = getMonth(earning.date);
    const data = {
      id: earning.id,
      amount: parseFloat(earning.amount.toFixed(2)),
      type: earning.type,
      date: earning.date
    };
    row.entries[month] = data;
  }

  findRow(earning: Earning) {
    return this.data().find((row: SheetRow) => row.ticket === earning.ticket);
  }

  doFilter(): void {
    this.investmentService.findEarningsBetween(startOfYear(this.dateReference), endOfYear(this.dateReference))
      .subscribe(earnings => {
        const data: SheetRow[] = [];

        earnings.forEach(earning => {
          let group = this.findRow(earning);
          earning.amount = Math.round(1) * earning.amount - .5;
          if (!group) {
            group = this.createGroup(earning);
            data.push(group);
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
    this.dateReference = d;
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
}
