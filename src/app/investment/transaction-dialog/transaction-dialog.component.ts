import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { combineLatest, startWith } from 'rxjs';
import { AccountTypeEnum } from '../../model/domain.model';
import { divide } from '../../model/functions.model';
import { InvestmentEnum } from '../../model/investment.model';
import { AssetQuoteType, InvestmentTransactionType, PortfolioType } from '../../model/source.model';
import { BalanceService } from '../../service/balance.service';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { getMarketPlaceCode, QuoteService } from '../../service/quote.service';
import { InvestmentTypePipe } from '../../utils/pipe/investment-type.pipe';

const PagesArray = new Array(5).fill(0).map((_,i)=>i);

type PortfolioQuantityType = PortfolioType & { quantity: number};

export type TransactionDialogType = {
  title: string,
  newTransaction: boolean,
  transaction: InvestmentTransactionType,
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
    InvestmentTypePipe
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

  private quoteService = inject(QuoteService);

  private portfolioService = inject(PortfolioService);

  private balanceService = inject(BalanceService);
  
  private fb = inject(FormBuilder);

  page : number = 0;

  assets = computed(() => {
    return Object.values(this.investmentService.assertsSignal()).reduce((acc, asset)=>{
      acc[getMarketPlaceCode(asset)] = asset;
      return acc;
    }, {} as {[key: string]:AssetQuoteType});
  })

  marketPlaces = computed(() => {
    const values = new Set(Object.values((this.assets() || {} as Record<string, AssetQuoteType>)).map(asset=>(asset.marketPlace)));
    return Array.from(values);
  })

  readonly transactionForm = this.fb.group({
    transaction: this.fb.group({
      marketPlace: this.fb.control(this.assets()[this.data.transaction.ticker]?.marketPlace, [Validators.required]),
      ticker: this.fb.control(this.assets()[this.data.transaction.ticker]?.code, [Validators.required]),
      id: this.fb.control(this.data.transaction.id),
      date: this.fb.control(this.data.transaction.date, [Validators.required]),
      accountId: this.fb.control(this.data.transaction.accountId, []),
      quantity: this.fb.control(this.data.transaction.quantity, [Validators.required, Validators.min(0.000001)]),
      quote: this.fb.control(this.data.transaction.quote, [Validators.required, Validators.min(0.01)]),
      value: this.fb.group({
        amount: this.fb.control(this.data.transaction.value.value, [Validators.required, Validators.min(0.01)]),
        currency: this.fb.control(this.data.transaction.value.currency, [Validators.required])
      }),
      type: this.fb.control(this.data.transaction.type, [Validators.required]),
      fees: this.fb.control(this.data.transaction.fees, []),
    }),
    portfolios: this.fb.array([], [])
  });

  readonly transactionTypes = Object.values(InvestmentEnum);

  portfolioList = signal(this.portfolios.value)

  accounts = computed(() => 
    Object.values(this.balanceService.getAllBalances())
      .filter(balance => balance.type === AccountTypeEnum.INVESTMENT)
      .map(balance=>[balance.id, balance.accountName]))

  ngOnInit(): void {
    const ticker = this.data.newTransaction? undefined : this.data.transaction.ticker;
    const quotes = this.quoteService.quotes() || {};
    if (!!ticker) {
      // FIXME: Não está preenchendo corretamente o formulário. Quando dividir a alocação, deve gerar várias transações. Adicionar o portfolio de destino.
      this.ticker.disable();
      const quoteTicker = quotes[ticker];
      if (quoteTicker) {
        this.quote.setValue(quoteTicker.quote.value);
      }
    }
    else {
      this.ticker.valueChanges.subscribe(ticker=>{
        const quoteTicker = quotes[ticker];
        if (quoteTicker) {
          this.quote.setValue(quoteTicker.quote.value);
        }
      })
    }

    const summaries = !ticker ? this.portfolioService.getAllPortfolios().map(portfolio=>({...portfolio, quantity: 0} as PortfolioQuantityType))
      : this.getPortfoliosAssetsSummary(ticker).map(item=> ({...item.portfolio, quantity: item.quantity} as PortfolioQuantityType));

    summaries.forEach(portfolio=> {
      this.addPortfolio(portfolio);
    })
    this.portfolioList.set(summaries);

    combineLatest([
      this.quantity.valueChanges.pipe(startWith(this.quantity.value)),
      this.quote.valueChanges.pipe(startWith(this.quote.value))
    ]).subscribe(([quantity, quote])=>{
      this.amount.setValue(quantity * quote, {emitEvent: false});
    })

    this.amount.valueChanges.subscribe(amount=>{
      const quote = this.quote.value;
      this.quantity.setValue(divide(amount, quote), {emitEvent: false});
    })
  }

  
  getPortfoliosAssetsSummary(ticker?: string) {
    return this.portfolioService.getAllPortfolios().map(portfolio=>({
      portfolio: {...portfolio},
      quantity: Object.values(portfolio.allocations)
        .filter(item=>ticker && ticker === item.ticker)
        .reduce((acc, vl) => acc + (vl?.quantity || 0), 0)
    }))
  }

  addQuantity(quantity: number) {
    this.quantity.setValue(this.quantity.value + quantity);
  }

  get ticker() {
    return this.transactionForm.get('transaction.ticker') as FormControl;
  }

  get date() {
    return this.transactionForm.get('transaction.date') as FormControl;
  }

  get accountId() {
    return this.transactionForm.get('transaction.accountId') as FormControl<string>;
  }

  get quantity() {
    return this.transactionForm.get('transaction.quantity') as FormControl<number>;
  }

  get quote() {
    return this.transactionForm.get('transaction.quote') as FormControl<number>;
  }

  get amount() {
    return this.transactionForm.get('transaction.value.amount') as FormControl<number>;
  }

  get type() {
    return this.transactionForm.get('transaction.type') as FormControl<InvestmentEnum>;
  }

  get fees() {
    return this.transactionForm.get('transaction.fees') as FormControl<number | undefined>;
  }

  get assetSelected() {
    const assets = this.assets();
    if (this.ticker.value && assets) {
      return assets[this.ticker.value];
    }
    return undefined ;
  }

  get portfolios() {
    return this.transactionForm.get('portfolios') as FormArray<FormGroup<{id: FormControl<string | null>, name: FormControl<string | null>, quantity: FormControl<number | null>}>>;
  }

  get formValue() {
    const formValue = {
      ...this.data,
      ...this.transactionForm.value, 
      transaction: {
        ...this.transactionForm.value.transaction, 
        ticker: this.ticker.value
      }};
    return formValue;
  }

  submitForm() {
    this.dialogRef.close(this.formValue);
  }

  selectAll($event: FocusEvent) {
    ($event.target as HTMLInputElement).select();
  }

  gotoPage(page: number) {
    this.page = page;
  }

  get undistributed() {
    return this.portfolios.value.reduce((acc, portfolio)=>{
      acc -= portfolio.quantity as number;
      return acc;
    }, this.quantity.value);
  }

  addPortfolio({id = '', name = '', quantity = 0}: {id?: string, name?: string, quantity?: number} = {}) {
    const portfolioControl = this.fb.group({
      id: this.fb.control(id),
      name: this.fb.control(name, Validators.required),
      quantity: this.fb.control(quantity, [Validators.required, Validators.min(0)])
    });
    portfolioControl.patchValue({id, name, quantity})
    this.portfolios.push(portfolioControl);
  }

    
}
