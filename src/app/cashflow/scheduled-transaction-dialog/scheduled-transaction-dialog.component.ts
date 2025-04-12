import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UTCDate } from '@date-fns/utc';
import { Currency, Scheduled, TransactionEnum } from '../../model/domain.model';
import { ScheduledStatemetType } from '../../model/source.model';
import { BalanceService } from '../../service/balance.service';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';

export type DialogData = {
  title: string,
  scheduled: ScheduledStatemetType
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
  selector: 'app-scheduled-transaction-dialog',
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
  templateUrl: './scheduled-transaction-dialog.component.html',
  styleUrl: './scheduled-transaction-dialog.component.scss'
})
export class ScheduledTransactionDialogComponent implements OnInit {

  private data = inject<DialogData>(MAT_DIALOG_DATA);

  private dialogRef = inject(MatDialogRef<ScheduledTransactionDialogComponent>);

  private balanceService = inject(BalanceService);

  private fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({
    description: this.fb.control(this.data.scheduled.description, [Validators.required]),
    amount: this.fb.control(this.data.scheduled.amount.value, [Validators.required, Validators.min(0.01)]),
    currency: this.fb.control(this.data.scheduled.amount.currency, [Validators.required]),
    type: this.fb.control(this.data.scheduled.type, [Validators.required]),
    originAccountId: this.fb.control(this.data.scheduled.originAccountId, [Validators.required]),
    targetAccounId: this.fb.control(this.data.scheduled.targetAccountId || ''),
    category: this.fb.control(this.data.scheduled.category || ''),
    scheduledType: this.fb.control(this.data.scheduled.scheduled.type, [Validators.required]),
    startDate: this.fb.control(this.data.scheduled.scheduled.startDate, [Validators.required]),
    endDate: this.fb.control(this.data.scheduled.scheduled.endDate || ''),
  });

  currencies = Object.values(Currency);

  transactionTypes = Object.values(TransactionEnum);

  scheduledTypes = Object.values(Scheduled);

  accounts = Object.values(this.balanceService.getAllBalances()) as {id?: string, accountName: string}[];

  accountsDest = [{id: undefined, accountName: 'Selecione...'}, ...this.accounts]

  ngOnInit(): void {
    this.enableDisableScheduledType();

    this.form.get('scheduledType')?.valueChanges.subscribe(_=>{
      this.enableDisableScheduledType();
    });
  }
  
  enableDisableScheduledType() {
    if (this.form.get('scheduledType')?.value === Scheduled.ONCE) {
      this.form.get('endDate')?.disable()
    }
    else {
      const endDate = this.form.get('endDate');
      if (endDate) {
        endDate.enable();
        if (!endDate.value) {
          endDate.setValue(this.form.get('startDate')?.value);
        }
      }
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
      const updatedData: ScheduledStatemetType = {
        ...this.data,
        description: this.form.value.description,
        type: this.form.value.type,
        amount: {
          value: this.form.value.amount,
          currency: this.form.value.currency,
        },
        originAccountId: this.form.value.originAccountId,
        targetAccountId: this.form.value.targetAccounId,
        category: this.form.value.category,
        scheduled: {
          type: this.form.value.scheduledType,
          startDate: new UTCDate(this.form.value.startDate),
          endDate: new UTCDate(this.form.value.endDate),
        },
      };
      this.dialogRef.close(updatedData);
    }
  }

  displayScheduledPeriod() {
    return this.form.value.scheduledType !== Scheduled.ONCE;
  }
}
