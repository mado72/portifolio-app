import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UTCDate } from '@date-fns/utc';
import { Currency, Recurrence, StatementEnum } from '../../model/domain.model';
import { RecurrenceStatemetType } from '../../model/source.model';
import { BalanceService } from '../../service/balance.service';
import { provideAppDateAdapter } from '../../utils/pipe/app-date-adapter.adapter';

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
  }
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
    ReactiveFormsModule
  ],
  providers: [
    provideAppDateAdapter(PTBR_FORMATS)
  ],
  templateUrl: './recurrence-transaction-dialog.component.html',
  styleUrl: './recurrence-transaction-dialog.component.scss'
})
export class RecurrenceTransactionDialogComponent implements OnInit {

  private data = inject<DialogData>(MAT_DIALOG_DATA);

  private dialogRef = inject(MatDialogRef<RecurrenceTransactionDialogComponent>);

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

  statementTypes = Object.values(StatementEnum);

  recurrenceTypes = Object.values(Recurrence);

  accounts = Object.values(this.balanceService.getAllBalances()) as {id?: string, accountName: string}[];

  accountsDest = [...this.accounts].unshift({id: undefined, accountName: 'Nenhuma'})

  ngOnInit(): void {
    this.enableDisableRecurrenceType();

    this.form.get('recurrenceType')?.valueChanges.subscribe(_=>{
      this.enableDisableRecurrenceType();
    });
  }
  
  enableDisableRecurrenceType() {
    if (this.form.get('recurrenceType')?.value === Recurrence.ONCE) {
      this.form.get('endDate')?.disable()
    }
    else {
      this.form.get('endDate')?.enable()
    }
  }

  get labelStartDate () {
    return this.form.get('endDate')?.enabled ? 'Data de Início' : 'Data da Transação';
  }


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
          startDate: new UTCDate(this.form.value.startDate),
          endDate: new UTCDate(this.form.value.endDate),
        },
      };
      this.dialogRef.close(updatedData);
    }
  }

  displayRecurrencePeriod() {
    return this.form.value.recurrenceType !== Recurrence.ONCE;
  }
}
