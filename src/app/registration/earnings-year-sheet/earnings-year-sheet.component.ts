import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { InvestmentService } from '../../service/investment.service';
import { Earning, EarningsEnum } from '../../model/investment.model';
import { endOfYear, format, getMonth, startOfYear } from 'date-fns';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';
import { DecimalPipe, JsonPipe } from '@angular/common';


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
  amount: number,
  date: Date
}
type SheetRow = {
  ticket: string;
  description: string;
  type: EarningsEnum;
  vlJan: EarningEntry;
  vlFev: EarningEntry;
  vlMar: EarningEntry;
  vlAbr: EarningEntry;
  vlMai: EarningEntry;
  vlJun: EarningEntry;
  vlJul: EarningEntry;
  vlAgo: EarningEntry;
  vlSet: EarningEntry;
  vlOut: EarningEntry;
  vlNov: EarningEntry;
  vlDez: EarningEntry;
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
    ReactiveFormsModule,
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

  private fb = inject(FormBuilder);

  private investmentService = inject(InvestmentService);

  private changeDetectorRef = inject(ChangeDetectorRef);

  dateReference = new Date();

  readonly months = new Array(12).fill(0).map((_, i) => format(new Date(0, i), 'MMM'));
  readonly vlMonths = new Array(12).fill(0).map((_, i) => `vl${i}`);

  form = this.fb.group({
    data: this.fb.array([] as FormGroup[])
  });

  asset = this.investmentService.assertsSignal();

  readonly displayedColumns = ['ticket', 'description', 'vl0', 'vl1', 'vl2', 'vl3', 'vl4', 'vl5', 'vl6', 'vl7', 'vl8', 'vl9', 'vl10', 'vl11'];

  ngOnInit(): void {
    this.doFilter();
  }

  createGroup(earning: Earning): FormGroup {
    let group = this.fb.group({
      ticket: [earning.ticket],
      description: [this.asset[earning.ticket].name],
      vl0: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl1: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl2: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl3: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl4: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl5: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl6: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl7: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl8: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl9: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl10: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] }),
      vl11: this.fb.group({ id: [], amount: [0], type: [EarningsEnum.DIVIDENDS] })
    });

    this.setEarningValue(earning, group);
    return group;
  }

  setEarningValue(earning: Earning, group: FormGroup) {
    const month = `vl${getMonth(earning.date)}`;
    const vlMonth = group.get(month);
    if (vlMonth) {
      const data = {
        id: earning.id,
        amount: parseFloat(earning.amount.toFixed(2)),
        type: earning.type,
        date: earning.date
      };
      vlMonth.patchValue(data);
    }
  }

  findGroup(earning: Earning) {
    return this.data.controls.find((g: FormGroup) => g.get('ticket')?.value === earning.ticket);
  }

  get data(): FormArray<FormGroup> {
    return this.form.get('data') as FormArray;
  }

  get rows() {
    return this.data.controls;
  }

  doFilter(): void {
    this.investmentService.findEarningsBetween(startOfYear(this.dateReference), endOfYear(this.dateReference))
      .subscribe(earnings => {
        this.data.clear();
        earnings.forEach(earning => {
          let group = this.findGroup(earning);
          earning.amount = Math.round(1) * earning.amount - .5;
          if (!group) {
            group = this.createGroup(earning);
            this.data.push(group);
          }
          else {
            this.setEarningValue(earning, group);
          }
        });
        this.changeDetectorRef.detectChanges();
      });
  }

  choosenYear(d: Date, picker: MatDatepicker<any>): void {
    this.dateReference = d;
    picker.close();
    this.data.clear();
    this.doFilter();
  }

  totalMonth(vlMonth: string): number {
    return parseFloat(this.data.value.reduce((acc, item)=>acc += item[vlMonth].amount, 0).toFixed(2));
  }
}
