import { Component, inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AccountBalanceExchange, AccountTypeEnum, Currency } from '../../model/domain.model';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AccountTypePipe } from '../../utils/pipe/account-type.pipe';

export type BalanceDialogType = {
  title: string,
  account: {
    id: string,
    accountName: string,
    type: AccountTypeEnum,
    currency: Currency,
    value: number
  }
}

@Component({
  selector: 'app-balance-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    AccountTypePipe
  ],
  templateUrl: './balance-dialog.component.html',
  styleUrl: './balance-dialog.component.scss'
})
export class BalanceDialogComponent implements OnInit {

  private fb = inject(FormBuilder);

  private dialogRef = inject(MatDialogRef<BalanceDialogComponent>);

  readonly data = inject<BalanceDialogType>(MAT_DIALOG_DATA);

  readonly entryForm = this.fb.group({
    id: this.data.account.id,
    accountName: this.fb.control(this.data.account.accountName, [Validators.required]),
    type: this.fb.control(this.data.account.type, [Validators.required]),
    balance: this.fb.group({
      currency: this.fb.control(this.data.account.currency, [Validators.required]),
      value: this.fb.control(this.data.account.value, [Validators.required])
    })
  })

  readonly accountTypeOptions = Object.values(AccountTypeEnum)
  readonly currencyOptions = Object.values(Currency)

  ngOnInit(): void {
  }

  get accountName() {
    return this.entryForm.get('accountName') as FormControl;
  }

  get type() {
    return this.entryForm.get('type') as FormControl;
  }

  get currency() {
    return this.entryForm.get('balance.currency') as FormControl;
  }

  get value() {
    return this.entryForm.get('balance.value') as FormControl;
  }

  submitForm() {
    this.dialogRef.close(this.entryForm.value);
  }

  add(value: number) {
    this.value.setValue(this.value.value + value);
  }
    
}
