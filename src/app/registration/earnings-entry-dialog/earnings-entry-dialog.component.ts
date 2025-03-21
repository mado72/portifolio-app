import { NgIf } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EarningsDesc, EarningEnum } from '../../model/investment.model';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';

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
  "type": EarningEnum;
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
    date: [new Date(), []],
    amount: [0, []],
    type: [EarningEnum.DIVIDENDS, []]
  });

  readonly typeOptions = Object.values(EarningEnum);

  @Input() title = 'Earning Entry';

  ngOnInit() {
    this.entryForm.patchValue(this.data.entry);
    const type = this.entryForm.get('type');
    if (!! this.data.type && !! type) {
      this.entryForm.get('type')?.setValue(this.data.type)
      type.disable();
    }
    this.title = this.data.title;
  }

  earningDesc(earningEnum: EarningEnum) {
    return EarningsDesc[earningEnum];
  }

  cancelClick() {
    this.dialogRef.close();
  }
  selectText($event: FocusEvent) {
    ($event.target as HTMLInputElement)?.select();
  }

  submitForm() {
    this.dialogRef.close(this.entryForm.value);
  }
}
