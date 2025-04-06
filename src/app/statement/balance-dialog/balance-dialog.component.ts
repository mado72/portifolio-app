import { Component, inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AccountTypeEnum, Currency } from '../../model/domain.model';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AccountTypePipe } from '../../utils/account-type.pipe';
import { BalanceType } from '../../model/source.model';

export type BalanceDialogType = {
  title: string,
  account : BalanceType
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
    id: '',
    account: this.fb.control('', [Validators.required]),
    type: this.fb.control(AccountTypeEnum.CHECKING, [Validators.required]),
    balance: this.fb.group({
      currency: this.fb.control(this.data.account.balance.currency, [Validators.required]),
      price: this.fb.control(this.data.account.balance.price, [Validators.required])
    })
  })

  readonly accountTypeOptions = Object.values(AccountTypeEnum)
  readonly currencyOptions = Object.values(Currency)

  ngOnInit(): void {
    this.entryForm.patchValue(this.data.account);
  }

  get account() {
    return this.entryForm.get('account') as FormControl;
  }

  get type() {
    return this.entryForm.get('type') as FormControl;
  }

  get currency() {
    return this.entryForm.get('balance.currency') as FormControl;
  }

  get price() {
    return this.entryForm.get('balance.price') as FormControl;
  }

  submitForm() {
    this.dialogRef.close(this.entryForm.value);
  }

  add(value: number) {
    this.price.setValue(this.price.value + value);
  }
    
}
