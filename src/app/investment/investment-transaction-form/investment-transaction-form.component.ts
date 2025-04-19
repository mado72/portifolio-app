import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { combineLatest, debounceTime, distinctUntilChanged, Observable, startWith } from 'rxjs';
import { Currency } from '../../model/domain.model';
import { InvestmentEnum, MarketPlaceEnum, TransactionStatus } from '../../model/investment.model';
import { InvestmentTransactionType } from '../../model/source.model';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { getMarketPlaceCode, QuoteService } from '../../service/quote.service';
import { SelectOnFocusDirective } from '../../utils/directive/select-on-focus.directive';
import { InvestmentTypePipe } from '../../utils/pipe/investment-type.pipe';

export type IntestmentTransactionFormData = ReturnType<InvestmentTransactionFormComponent["formValue"]> | null

export type InvestmentTransactionFormResult = InvestmentTransactionType & {
  allocations: { id: string; qty: number }[];
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
    InvestmentTypePipe,
    SelectOnFocusDirective,
  ],
  templateUrl: './investment-transaction-form.component.html',
  styleUrl: './investment-transaction-form.component.scss'
})
export class InvestmentTransactionFormComponent implements OnInit {

  private quoteService = inject(QuoteService);

  private portfolioService = inject(PortfolioService);

  private balanceService = inject(BalanceService);

  private fb = inject(FormBuilder);

  @Output() onSubmit = new EventEmitter<InvestmentTransactionFormResult>();

  @Output() onCancel = new EventEmitter<void>();

  currencies = ['BRL', 'USD', 'EUR']; // Moedas disponíveis

  transactionTypes = Object.keys(InvestmentEnum); // Tipos de transação

  assets = this.quoteService.quotes;

  marketPlaces = computed(() => Object.keys(MarketPlaceEnum));

  ticker = signal<string | null>(null);

  data = input<IntestmentTransactionFormData>({});

  accountName = signal('');

  accounts = computed(()=>this.balanceService.getAccounts());

  allocations = computed(() =>
    Object.values(this.portfolioService.getAllPortfolios()
      .map(portfolio => ({
        id: portfolio.id,
        name: portfolio.name,
        qty: Object.values(portfolio.allocations)
          .filter(allocation => this.data()?.id && allocation.transactionId === this.data()?.id)
          .map(allocation => allocation.quantity)
          .reduce((tot, vl) => tot += vl, 0)
      })))
      .reduce((acc, portfolio)=>{
        acc[portfolio.id] = portfolio;
        return acc;
      }, {} as Record<string, {id: string, name: string, qty: number}>)
    )

  transactionForm = this.fb.group({
    id: [''],
    marketPlace: ['', Validators.required],
    code: ['', Validators.required],
    date: [null as unknown as Date, Validators.required],
    accountId: ['', Validators.required, isAccountMatchedValidator(this.accounts())],
    quantity: [0, [Validators.required, Validators.min(1)]],
    quote: [0, [Validators.required, Validators.min(0)]],
    amount: [0, [Validators.required, Validators.min(0)]],
    type: ['', Validators.required],
    fees: [0, [Validators.min(0)]],
    allocations: this.fb.array([] as { id: string, qty: number, name: string }[])
  }, {
    validators: [isAllAllocationsDoneValidator("quantity", "allocations")],
  });

  get allocationArray() {
    return this.transactionForm.get("allocations") as FormArray<FormGroup<{ 
      id: FormControl<string | null>, 
      qty: FormControl<number | null>, 
      name: FormControl<string | null> }>>;
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
    this.initializeAllocationControls();
    const marketPlace = this.data()?.marketPlace
    const code = this.data()?.code
    if (marketPlace && code) {
      this.transactionForm.get('marketPlace')?.setValue(marketPlace);
      this.transactionForm.get('code')?.setValue(code);
      this.ticker.set(getMarketPlaceCode({ marketPlace, code }));
    }

    effect(() => {
      this.allocationArray.patchValue(Object.values(this.allocations()));
    })

    effect(() => {
      const assetSelected = this.assetSelected();
      const ticker = this.ticker();
      if (!this.data()?.quote) {
        if (assetSelected) {
          this.transactionForm.get('quote')?.setValue(assetSelected.quote.value);
        }
        else if (ticker && ticker.includes(':')) {
          const [marketPlace, code] = ticker.split(':');
          if (!!code) {
            this.quoteService.getRemoteQuote(ticker).subscribe(price => {
              if (!!price) {
                this.transactionForm.get('quote')?.setValue(price);
              }
            })
          }
        }
      }
    })

    this.listenMarketplaceAndCodeToFillTickerValue();
    this.listenAccountIdToFillAccountName();
    this.listenQuantityAndQuoteToFillAmountValue();
  }

  ngOnInit(): void {
    const data = this.data();
    if (data) {
      this.transactionForm.patchValue(data);
    }
  }

  formValue() {
    return this.transactionForm.value;
  }

  badgeValue(allocationId: string ) {
    const portfolio = this.allocations()[allocationId];
    return portfolio?.qty || 0;
  }

  allocationValue() {
    return this.transactionForm.get('allocations')?.value as {
      id  : string;
      name: string;
      qty : number;
    }[];
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
    ).subscribe(accountName => this.accountName.set(accountName));
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

  initializeAllocationControls() {
    this.allocationArray.clear();
    Object.values(this.allocations()).forEach((alloc) => {
      this.allocationArray.push(this.createAllocationItem(alloc.id, alloc.name, alloc.qty));
    })
  }

  createAllocationItem(id: string, name: string, qty: number) {
    return this.fb.group({
      id: this.fb.control<string>(id),
      name: this.fb.control<string>(name),
      qty: this.fb.control<number>(qty, [Validators.required, Validators.min(0)])
    });
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
      this.allocationArray.errors
      const allocations = this.allocationArray.value
        .filter(item => item.id && item.qty)
        .map(item => ({ ...item as { id: string, qty: number; name: string } }));
      const transaction: InvestmentTransactionFormResult = {
        accountId: formData.accountId as string,
        date: formData.date as Date,
        id: this.data()?.id as unknown as string,
        quantity: formData.quantity as number,
        quote: formData.quote as number,
        status: TransactionStatus.PENDING,
        ticker: this.ticker() as string,
        type: formData.type as InvestmentEnum,
        value: {
          currency: this.assetSelected()?.quote.currency as Currency,
          value: formData.amount as number,
        },
        fees: formData.fees || undefined,
        allocations
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
    const allocationField = group.get(allocationControlName) as FormArray<FormGroup<{ id: FormControl<string>; qty: FormControl<number> }>>;

    if (!quantityField || !allocationField || !(allocationField instanceof FormArray)) {
      return {
        "invalidSetup": {
          quantityControlName,
          allocationControlName
        }
      }
    }

    if (quantityField.errors || allocationField.errors) {
      return { "cantValidate": true }
    }

    const quantity = quantityField.value as number;
    const total = (allocationField.value).reduce((acc, vl) => acc += vl.qty || 0, 0);

    if (quantity != total) {
      return {
        "notMatched": {
          quantity,
          total
        }
      }
    }
    return null;
  }
}

