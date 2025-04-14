import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, EventEmitter, inject, Output, signal } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { combineLatest, debounceTime, distinctUntilChanged, Observable, startWith } from 'rxjs';
import { Currency } from '../../model/domain.model';
import { InvestmentEnum, TransactionStatus } from '../../model/investment.model';
import { InvestmentTransactionType } from '../../model/source.model';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { getMarketPlaceCode, QuoteService } from '../../service/quote.service';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';
import { SelectOnFocusDirective } from '../../utils/directive/select-on-focus.directive';
import { InvestmentTypePipe } from '../../utils/pipe/investment-type.pipe';

export type InvestmentTransactionFormResult = InvestmentTransactionType & {
  allocations: Record<string, number>;
}
@Component({
  selector: 'app-investment-transaction-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    NgTemplateOutlet,
    MatBadgeModule,
    InvestmentTypePipe,
    SelectOnFocusDirective
  ],
  providers: [
    provideAppDateAdapter()
  ],
  templateUrl: './investment-transaction-form.component.html',
  styleUrl: './investment-transaction-form.component.scss'
})
export class InvestmentTransactionFormComponent {

  private quoteService = inject(QuoteService);

  private portfolioService = inject(PortfolioService);

  private balanceService = inject(BalanceService);

  private fb = inject(FormBuilder);

  @Output() onSubmit = new EventEmitter<InvestmentTransactionFormResult>();

  @Output() onCancel = new EventEmitter<void>();

  currencies = ['BRL', 'USD', 'EUR']; // Moedas disponíveis

  transactionTypes = Object.keys(InvestmentEnum); // Tipos de transação

  assets = this.quoteService.quotes;

  marketPlaces = computed(() => {
    const assets = this.assets();
    const marketPlaces = new Set(Object.values(assets).map(asset => asset.marketPlace))
    return Array.from(marketPlaces);
  })

  ticker = signal<string | null>(null);

  accountName = signal('');

  accounts = this.balanceService.getAccounts;

  portfolios = computed(() =>
    Object.values(this.portfolioService.getAllPortfolios()
      .map(portfolio => ({
        id: portfolio.id,
        name: portfolio.name,
        allocation: Object.values(portfolio.allocations)
          .filter(allocation => allocation.ticker === this.ticker())
          .map(allocation => allocation.quantity)
          .reduce((tot, vl) => tot += vl, 0)
      }))
    ))

  transactionForm = this.fb.group({
    marketPlace: ['', Validators.required],
    code: ['', Validators.required],
    date: [null as unknown as Date, Validators.required],
    accountId: ['', Validators.required, isAccountMatchedValidator(this.accounts())],
    quantity: [0, [Validators.required, Validators.min(1)]],
    quote: [0, [Validators.required, Validators.min(0)]],
    amount: [0, [Validators.required, Validators.min(0)]],
    type: ['', Validators.required],
    brokerage: [0, [Validators.min(0)]],
    allocations: this.fb.array([] as number[])
  }, {
    validators: [isAllAllocationsDoneValidator("quantity", "allocations")],
  });

  get allocationArray() {
    return this.transactionForm.get("allocations") as FormArray;
  }

  optionsCode = computed(() => {
    const ticker = this.ticker();
    if (!ticker) return [];
    return Object.entries(this.assets()).filter(([key, _]) => key.startsWith(ticker)).map(([_, asset]) => asset.code);
  });

  optionsAccount = computed(() => {
    const accountName = this.accountName();
    return this.accounts()
      .filter(acc => acc.account.toLocaleLowerCase().includes(accountName.toLocaleLowerCase()));
  });

  assetSelected = computed(() => {
    const ticker = this.ticker();
    return ticker ? this.assets()[ticker] : null;
  })

  constructor() {
    const portfolios = this.portfolios();
    this.initializeAllocationControls(portfolios);

    effect(() => {
      const portfolios = this.portfolios();
      const allocations = new Array(portfolios.length).fill(0);
      this.allocationArray.patchValue(allocations);
    })

    effect(() => {
      const assetSelected = this.assetSelected();
      if (assetSelected) {
        this.transactionForm.get('quote')?.setValue(assetSelected.quote.value);
      }
    })

    this.listenMarketplaceAndCodeToFillTickerValue();
    this.listenAccountIdToFillAccountName();
    this.listenQuantityAndQuoteToFillAmountValue();
  }

  listenMarketplaceAndCodeToFillTickerValue() {
    const marketPlaceField = this.transactionForm.get("marketPlace") as FormControl<string>;
    const codeField = this.transactionForm.get("code") as FormControl<string>;

    combineLatest({
      marketPlace: marketPlaceField.valueChanges.pipe(
        startWith(marketPlaceField.value)
      ),
      code: codeField.valueChanges.pipe(
        startWith(codeField.value)
      )
    }).pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe((ticker) => this.ticker.set(getMarketPlaceCode(ticker))
    );
  }

  listenAccountIdToFillAccountName() {
    const accountIdField = this.transactionForm.get("accountId") as FormControl;
    accountIdField.valueChanges.pipe(
      startWith(accountIdField.value),
      debounceTime(1000),
      distinctUntilChanged()
    )
      .subscribe(accountName => this.accountName.set(accountName));
  }

  listenQuantityAndQuoteToFillAmountValue() {
    const quantityField = this.transactionForm.get("quantity") as FormControl<number>;
    const quoteField = this.transactionForm.get("quote") as FormControl<number>;
    const amountField = this.transactionForm.get("amount") as FormControl<number>;

    combineLatest([
      quantityField.valueChanges.pipe(startWith(quantityField.value)),
      quoteField.valueChanges.pipe(startWith(quoteField.value))
    ]).pipe(
      distinctUntilChanged()
    ).subscribe(([quantity, quote]) => {
      amountField.setValue(Number((quantity * quote).toPrecision(6)))
    })
  }

  initializeAllocationControls(portfolios: { id: string; name: string; allocation: number; }[]) {
    this.allocationArray.clear();
    portfolios.forEach(()=> {
      this.allocationArray.push(this.fb.control(0, [Validators.required, Validators.min(0)]));
    })
  }

  accountNameDisplay = (id: string): string => this.balanceService.getAccounts()
    .filter(acc => acc.id === id)
    .map(acc => acc.account).find(_ => true) || '';

  toUpercase($event: Event) {
    const input = ($event.target) as HTMLInputElement;
    input.value = input.value.toLocaleUpperCase();
  }

  onSubmitRequest() {
    if (this.transactionForm.valid) {
      const formData = this.transactionForm.value;
      const transaction: InvestmentTransactionFormResult = {
        accountId: formData.accountId as string,
        date: formData.date as Date,
        id: null as unknown as string,
        quantity: formData.quantity as number,
        quote: formData.quote as number,
        status: TransactionStatus.PENDING,
        ticker: this.ticker() as string,
        type: formData.type as InvestmentEnum,
        value: {
          currency: this.assetSelected()?.quote.currency as Currency,
          value: formData.amount as number,
        },
        brokerage: formData.brokerage || undefined,
        allocations: this.portfolios().reduce((acc, portfolio, index) => {
          acc[portfolio.id] = (formData.allocations as number[])[index];
          return acc;
        }, {} as { [id: string]: number })
      }
      this.onSubmit.emit(transaction);
    }
  }

  onCancelRequest() {
    this.onCancel.emit();
  }

  addQuantity(value: number) {
    const field = this.transactionForm.get('quantity') as FormControl<number>;
    field.setValue(field.value + value);
  }

}

function isAccountMatchedValidator(accounts: { account: string, id: string }[]): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return new Observable<ValidationErrors | null>(subscriber => {
      const value = control.value as string;
      if (!accounts.find(account => account.id === value)) {
        subscriber.next({ "accountNotFound": { value } });
      }
      else {
        subscriber.next(null);
      }
      subscriber.complete();
    })
  }
}

function isAllAllocationsDoneValidator(quantityControlName: string, allocationControlName: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const quantityField = group.get(quantityControlName) as FormControl<number>;
    const allocationField = group.get(allocationControlName) as FormArray<FormControl<number>>;

    if (!quantityField || !allocationField || !(allocationField instanceof FormArray)) {
      return {
        "invalidSetup": {
          quantityControlName,
          allocationControlName
        }
      }
    }

    if (quantityField.errors || allocationField.errors) {
      return {"cantValidate": true}
    }

    const quantity = quantityField.value as number;
    const total = (allocationField.value as number[]).reduce((acc, vl)=>acc += vl,0);

    if (quantity != total) {
      return {"notMatched": {
        quantity,
        total
      }}
    }
    return null;
  }
}

