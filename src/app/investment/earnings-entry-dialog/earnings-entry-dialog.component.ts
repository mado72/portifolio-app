import { NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IncomeEnum, IncomeDesc } from '../../model/investment.model';
import { provideAppDateAdapter } from '../../utils/pipe/app-date-adapter.adapter';

const PTBR_FORMATS = {
  parse: {
    dateInput: 'dd/MM/yyyy',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

export type EarningsEntryDialogType = {
  "title": string;
  "type": IncomeEnum;
  "disabled"?: boolean;
  "entry": {
    id?: number;
    date?: Date;
    amount: number;
    acronym?: string;
  }
}
@Component({
  selector: 'app-earnings-entry-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    ReactiveFormsModule,
    NgIf
  ],
  providers: [
    provideAppDateAdapter(PTBR_FORMATS)
  ],
  templateUrl: './earnings-entry-dialog.component.html',
  styleUrl: './earnings-entry-dialog.component.scss'
})
export class EarningsEntryDialogComponent implements OnInit {

  private fb = inject(FormBuilder);

  readonly dialogRef = inject(MatDialogRef<EarningsEntryDialogComponent>)

  readonly data = inject<EarningsEntryDialogType>(MAT_DIALOG_DATA);

  readonly entryForm = this.fb.group({
    id: [NaN],
    date: [new Date(), []],
    amount: [0, []],
    type: [IncomeEnum.DIVIDENDS, []]
  });

  readonly typeOptions = Object.values(IncomeEnum);

  ngOnInit() {
    this.entryForm.patchValue(this.data.entry);
    const type = this.entryForm.get('type');
    if (!! this.data.disabled && type) {
      this.entryForm.get('type')?.setValue(this.data.type)
      type.disable();
    }
    this.data.title = this.data.title || 'Earning entry'
  }

  earningDesc(earningEnum: IncomeEnum) {
    return IncomeDesc[earningEnum];
  }

  selectText($event: FocusEvent) {
    ($event.target as HTMLInputElement)?.select();
  }

  submitForm() {
    this.dialogRef.close(this.entryForm.value);
  }
}
