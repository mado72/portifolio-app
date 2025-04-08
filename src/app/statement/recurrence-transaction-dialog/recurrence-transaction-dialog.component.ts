import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { StatementService } from '../../service/statement.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecurrenceStatemetType } from '../../model/source.model';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Currency, StatementEnum } from '../../model/domain.model';
import { provideAppDateAdapter } from '../../utils/pipe/app-date-adapter.adapter';
import { MatInputModule } from '@angular/material/input';
import { JsonPipe } from '@angular/common';
import { BalanceService } from '../../service/balance.service';

export type DialogData = {
  title: string,
  recurrence: RecurrenceStatemetType
}

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

@Component({
  selector: 'app-recurrence-transaction-dialog',
  standalone: true,
  imports: [
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    JsonPipe
  ],
  providers: [
    provideAppDateAdapter(PTBR_FORMATS)
  ],
  templateUrl: './recurrence-transaction-dialog.component.html',
  styleUrl: './recurrence-transaction-dialog.component.scss'
})
export class RecurrenceTransactionDialogComponent {

  private data = inject<DialogData>(MAT_DIALOG_DATA);

  private dialogRef = inject(MatDialogRef<RecurrenceTransactionDialogComponent>);

  private statementService = inject(StatementService);

  private balanceService = inject(BalanceService);

  private fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({
    description: this.fb.control(this.data.recurrence.description, [Validators.required]),
    amount: this.fb.control(this.data.recurrence.value.amount, [Validators.required, Validators.min(0.01)]),
    currency: this.fb.control(this.data.recurrence.value.currency, [Validators.required]),
    type: this.fb.control(this.data.recurrence.type, [Validators.required]),
    originAccountId: this.fb.control(this.data.recurrence.originAccountId, [Validators.required]),
    destAccounId: this.fb.control(this.data.recurrence.destAccounId || ''),
    category: this.fb.control(this.data.recurrence.category || ''),
    recurrenceType: this.fb.control(this.data.recurrence.recurrence.type, [Validators.required]),
    startDate: this.fb.control(this.data.recurrence.recurrence.startDate, [Validators.required]),
    endDate: this.fb.control(this.data.recurrence.recurrence.endDate || ''),
  });

  currencies = Object.values(Currency);

  recurrenceTypes = Object.values(StatementEnum);

  accounts = Object.values(this.balanceService.getAllBalances()) as {id?: string, accountName: string}[];

  accountsDest = [...this.accounts].unshift({id: undefined, accountName: 'Nenhuma'})

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const updatedData: RecurrenceStatemetType = {
        ...this.data,
        description: this.form.value.description,
        type: this.form.value.type,
        value: {
          amount: this.form.value.amount,
          currency: this.form.value.currency,
        },
        originAccountId: this.form.value.originAccountId,
        destAccounId: this.form.value.destAccounId,
        category: this.form.value.category,
        recurrence: {
          type: this.form.value.recurrenceType,
          startDate: this.form.value.startDate,
          endDate: this.form.value.endDate,
        },
      };
      this.dialogRef.close(updatedData);
    }
  }
}
