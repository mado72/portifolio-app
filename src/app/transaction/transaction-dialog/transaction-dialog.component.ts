import { Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TransactionTypePipe } from '../transaction-type.pipe';
import { TransactionStatusPipe } from '../transaction-status.pipe';
import { Asset, TransactionEnum, TransactionStatus, TransactionType } from '../../model/investment.model';
import { Currency } from '../../model/domain.model';
import { JsonPipe, KeyValuePipe } from '@angular/common';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';
import { provideNativeDateAdapter } from '@angular/material/core';
import { InvestmentService } from '../../service/investment.service';
import { getMarketPlaceCode } from '../../service/quote.service';

export type TransactionDialogType = {
  title: string,
  newTransaction: boolean,
  transaction: TransactionType
};

@Component({
  selector: 'app-transaction-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    JsonPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    TransactionTypePipe,
    TransactionStatusPipe
  ],
  providers: [
    provideNativeDateAdapter()
  ],
  templateUrl: './transaction-dialog.component.html',
  styleUrl: './transaction-dialog.component.scss'
})
export class TransactionDialogComponent implements OnInit {

  private dialogRef = inject(MatDialogRef<TransactionDialogComponent>);
  
  readonly data = inject<TransactionDialogType>(MAT_DIALOG_DATA);
  
  private investmentService = inject(InvestmentService);  
  
  private fb = inject(FormBuilder);  

  readonly transactionForm = this.fb.group({
    id: this.fb.control(this.data.transaction.id),
    ticket: this.fb.control(this.data.transaction.ticket),
    date: this.fb.control(this.data.transaction.date, []),
    accountId: this.fb.control(this.data.transaction.accountId, []),
    quantity: this.fb.control(this.data.transaction.quantity, []),
    quote: this.fb.control(this.data.transaction.quote, []),
    value: this.fb.group({
      amount: this.fb.control(this.data.transaction.value.amount, []),
      currency: this.fb.control(this.data.transaction.value.currency, [])
    }),
    type: this.fb.control(this.data.transaction.type, []),
    status: this.fb.control(this.data.transaction.status, []),
    brokerage: this.fb.control(this.data.transaction.brokerage, [])
  });

  readonly transactionTypes = Object.values(TransactionEnum);
  readonly transactionStatuses = Object.values(TransactionStatus);
  readonly currencies = Object.values(Currency);

  
  assets = computed(() => {
    if (!this.data.transaction.ticket) {
      return Object.values(this.investmentService.assertsSignal()).reduce((acc, asset)=>{
        acc[getMarketPlaceCode(asset)] = asset;
        return acc;
      }, {} as {[key: string]:Asset});
    }
    return undefined;
  })

  ngOnInit(): void {
    if (!this.data.newTransaction) {
      this.ticket.disable();
    }
  }

  get ticket() {
    return this.transactionForm.get('ticket') as FormControl;
  }

  get date() {
    return this.transactionForm.get('date') as FormControl;
  }

  get accountId() {
    return this.transactionForm.get('accountId') as FormControl;
  }

  get quantity() {
    return this.transactionForm.get('quantity') as FormControl;
  }

  get quote() {
    return this.transactionForm.get('quote') as FormControl;
  }

  get amount() {
    return this.transactionForm.get('value.amount') as FormControl;
  }

  get currency() {
    return this.transactionForm.get('value.currency') as FormControl;
  }

  get type() {
    return this.transactionForm.get('type') as FormControl;
  }

  get status() {
    return this.transactionForm.get('status') as FormControl;
  }

  get brokerage() {
    return this.transactionForm.get('brokerage') as FormControl;
  }

  get assetSelected() {
    const assets = this.assets();
    if (this.ticket.value && assets) {
      return assets[this.ticket.value];
    }
    return undefined ;
  }

  submitForm() {
    this.dialogRef.close(this.transactionForm.value);
  }

  quantityQuoteUpdated() {
    this.amount.setValue(Math.trunc(100 * this.quantity.value * this.quote.value) / 100 || undefined)
  }

  amountUpdated() {
    this.quote.setValue(Math.trunc(100 * this.amount.value / this.quantity.value) / 100 || undefined)
  }

  selectAll($event: FocusEvent) {
    ($event.target as HTMLInputElement).select();
  }

}
