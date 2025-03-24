import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { Asset, TransactionEnum, TransactionStatus, TransactionType } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { getMarketPlaceCode } from '../../service/quote.service';
import { TransactionStatusPipe } from '../transaction-status.pipe';
import { TransactionTypePipe } from '../transaction-type.pipe';

type Pages = "Asset" | "Portfolio";

export type TransactionDialogType = {
  title: string,
  newTransaction: boolean,
  transaction: TransactionType,
  portfolios: { 
    id: string,
    name: string,
    quantity: number }[]
};

@Component({
  selector: 'app-transaction-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    MatTableModule,
    MatIconModule,
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

  private changeDetectorRefs = inject(ChangeDetectorRef);
  
  readonly data = inject<TransactionDialogType>(MAT_DIALOG_DATA);
  
  private investmentService = inject(InvestmentService);  
  
  private fb = inject(FormBuilder);

  page : Pages = "Asset";

  readonly transactionForm = this.fb.group({
    id: this.fb.control(this.data.transaction.id),
    ticker: this.fb.control(this.data.transaction.ticker, [Validators.required]),
    date: this.fb.control(this.data.transaction.date, [Validators.required]),
    accountId: this.fb.control(this.data.transaction.accountId, []),
    quantity: this.fb.control(this.data.transaction.quantity, [Validators.required, Validators.min(0)]),
    quote: this.fb.control(this.data.transaction.quote, [Validators.required, Validators.min(0.01)]),
    value: this.fb.group({
      amount: this.fb.control(this.data.transaction.value.amount, [Validators.required, Validators.min(0.01)]),
      currency: this.fb.control(this.data.transaction.value.currency, [Validators.required])
    }),
    type: this.fb.control(this.data.transaction.type, [Validators.required]),
    status: this.fb.control(this.data.transaction.status, [Validators.required]),
    brokerage: this.fb.control(this.data.transaction.brokerage, []),
    portfolios: this.fb.array(this.data.portfolios.map(portfolio=>{
      return this.fb.group({
        id: this.fb.control(portfolio.id, []),
        name: this.fb.control(portfolio.name, [Validators.required]),
        quantity: this.fb.control(portfolio.quantity, [Validators.required, Validators.min(0)])
      })
    }), [])
  });

  readonly transactionTypes = Object.values(TransactionEnum);
  readonly transactionStatuses = Object.values(TransactionStatus);
  readonly currencies = Object.values(Currency);

  assets = computed(() => {
    if (!this.data.transaction.ticker) {
      return Object.values(this.investmentService.assertsSignal()).reduce((acc, asset)=>{
        acc[getMarketPlaceCode(asset)] = asset;
        return acc;
      }, {} as {[key: string]:Asset});
    }
    return undefined;
  })

  portfolioList = signal(this.portfolios.value)

  ngOnInit(): void {
    if (!this.data.newTransaction) {
      this.ticker.disable();
    }
  }

  get ticker() {
    return this.transactionForm.get('ticker') as FormControl;
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
    if (this.ticker.value && assets) {
      return assets[this.ticker.value];
    }
    return undefined ;
  }

  get portfolios() {
    return this.transactionForm.get('portfolios') as FormArray<FormGroup>;
  }

  get formValue() {
    return {...this.data, ...this.transactionForm.value};
  }

  submitForm() {
    this.dialogRef.close(this.formValue);
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

  gotoPage(page: Pages) {
    this.page = page;
  }

  get undistributed() {
    return this.portfolios.value.reduce((acc, portfolio)=>{
      acc -= portfolio.quantity;
      return acc;
    }, this.quantity.value);
  }

  addPortfolio() {
    this.portfolios.push(this.fb.group({
      id: '',
      name: '',
      quantity: 0
    }));
    this.portfolioList.set(this.portfolios.value);
    // this.changeDetectorRefs.detectChanges();
  }
    
}
