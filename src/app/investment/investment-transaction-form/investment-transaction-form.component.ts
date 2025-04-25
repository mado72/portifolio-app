import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, EventEmitter, inject, input, OnInit, Output, Signal, signal } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { combineLatest, debounceTime, distinctUntilChanged, Observable, startWith } from 'rxjs';
import { InvestmentAllocationField, InvestmentAllocationFormComponent } from '../investment-allocation-form/investment-allocation-form.component';
import { Currency } from '../../model/domain.model';
import { InvestmentEnum, MarketPlaceEnum, TransactionStatus } from '../../model/investment.model';
import { InvestmentTransactionType, PortfolioType } from '../../model/source.model';
import { AssetService } from '../../service/asset.service';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { getMarketPlaceCode } from '../../service/quote.service';
import { SelectOnFocusDirective } from '../../utils/directive/select-on-focus.directive';
import { InvestmentTypePipe } from '../../utils/pipe/investment-type.pipe';
import { validateIf, watchField } from '../../utils/validator/custom.validator';

export type IntestmentTransactionFormData = ReturnType<InvestmentTransactionFormComponent["formValue"]> | null

export type InvestmentTransactionFormResult = InvestmentTransactionType & {
  allocations: { id: string; qty: number }[];
}

@Component({
  selector: 'app-investment-transaction-form',
  standalone: true,
  imports: [
    InvestmentAllocationFormComponent,
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
    JsonPipe
  ],
  templateUrl: './investment-transaction-form.component.html',
  styleUrl: './investment-transaction-form.component.scss'
})
export class InvestmentTransactionFormComponent implements OnInit {

  private balanceService = inject(BalanceService);

  private portfolioService = inject(PortfolioService);

  private assetService = inject(AssetService);

  private fb = inject(FormBuilder);

  @Output() onSubmit = new EventEmitter<InvestmentTransactionFormResult>();

  @Output() onCancel = new EventEmitter<void>();

  currencies = Object.values(Currency); // Moedas disponíveis

  transactionTypes = Object.keys(InvestmentEnum); // Tipos de transação

  assets = this.assetService.assets;

  marketPlaces = Object.keys(MarketPlaceEnum);

  ticker = signal<string | null>(null);

  transactionType = signal<InvestmentEnum | null>(null);

  disabled = signal<string[]>([]);

  data = input<IntestmentTransactionFormData>({
    quantity: 0,
    allocations: []
  });

  quantity = signal(this.data()?.quantity || 0);

  accountName = signal('');

  accounts = computed(() => this.balanceService.getAccounts());

  allocations = computed(() => {
    const ticker = this.ticker();
    if (!ticker || ![InvestmentEnum.BUY, InvestmentEnum.SELL].includes(this.transactionType() as InvestmentEnum)) {
      return {} as ReturnType<InvestmentTransactionFormComponent["computeAllocationsOfTransaction"]>;
    }

    return this.computeAllocationsOfTransaction(
      Object.values(this.portfolioService.portfolios()),
      this.data()?.quantity || 0,
      this.data()?.id || undefined)
  });

  inputAllocations: InvestmentAllocationField[] = [];
  allocationsIsValid = true;

  transactionForm = this.fb.group({
    id: [''],
    marketPlace: ['', Validators.required],
    code: ['', Validators.required],
    date: [new Date(), Validators.required],
    accountId: ['', Validators.required, isAccountMatchedValidator(this.accounts)],
    quantity: [0, [validateIf(
      'type',
      (type: InvestmentEnum) => [InvestmentEnum.BUY, InvestmentEnum.SELL].includes(type),
      [Validators.required, Validators.min(1)]
    )]],
    quote: [0, [validateIf(
      'type',
      (type: InvestmentEnum) => [InvestmentEnum.BUY, InvestmentEnum.SELL].includes(type),
      [Validators.required, Validators.min(1)]
    )]],
    amount: [0, [Validators.required, Validators.min(0)]],
    type: [InvestmentEnum.BUY, [Validators.required, watchField()]],
    fees: [0, [Validators.min(0)]]
  });

  marketPlace = signal<string | null>(null);

  optionsCode = computed(() => {
    const marketPlace = this.marketPlace();
    if (!marketPlace) return [];
    return Object.entries(this.assets())
      .filter(([key, _]) => key.startsWith(`${marketPlace}:`))
      .map(([_, asset]) => asset.code);
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
    const marketPlace = this.data()?.marketPlace
    const code = this.data()?.code
    if (marketPlace && code) {
      this.transactionForm.get('marketPlace')?.setValue(marketPlace);
      this.transactionForm.get('code')?.setValue(code);
      this.ticker.set(getMarketPlaceCode({ marketPlace, code }));
    }

    effect(() => {
      const assetSelected = this.assetSelected();
      const tickerIsFilled = /.+:.+/.test(this.ticker() as string);
      if (assetSelected && tickerIsFilled && !this.data()?.quote) {
        this.transactionForm.get('quote')?.setValue(assetSelected.quote.value);
      }
    })

    this.listenMarketplaceAndCode();
    this.listenAccountIdToFillAccountName();
    this.listenQuantityAndQuoteToFillAmountValue();
    this.listenTypeField();
    this.transactionTypeEnableFields();
    this.transactionType.set(this.transactionForm.get('type')?.value || null);
  }

  ngOnInit(): void {
    const data = this.data();
    if (data) {
      this.transactionForm.patchValue(data);
    }
  }

  private computeAllocationsOfTransaction(portfolios: PortfolioType[], quantity: number, transactionId?: string):
    Record<string, { id: string; name: string; qty: number; allocated: number; }> {

    const ticker = this.ticker() || '';

    return portfolios.map(portfolio => {
      const allocation = portfolio.allocations[ticker];
      const allocated = allocation?.data.quantity || 0;
      return {
        id: portfolio.id,
        name: portfolio.name,
        allocated,
        qty: allocation?.data.transactions.find(({ id }) => id === transactionId)?.quantity || 0
      }
    }).reduce((acc, portfolio) => {
      acc[portfolio.id] = portfolio;
      return acc;
    }, {} as Record<string, { id: string; name: string; qty: number; allocated: number; }>);
  }
  setInputAllocations(inputAllocations: InvestmentAllocationField[]) {
    this.inputAllocations = inputAllocations;
  }

  setInputAllocationsIsValid(valid: boolean) {
    this.allocationsIsValid = valid;
  }

  formValue() {
    const formValue = this.transactionForm.value;
    return {
      ...formValue,
      allocations: this.inputAllocations
    };
  }

  badgeValue(allocationId: string) {
    const portfolio = this.allocations()[allocationId];
    return portfolio?.allocated || 0;
  }

  private listenMarketplaceAndCode() {
    const marketPlaceField = this.transactionForm.get("marketPlace") as FormControl<string>;
    const codeField = this.transactionForm.get("code") as FormControl<string>;

    const listenMarketPlaceChanges$ = marketPlaceField.valueChanges.pipe(
      startWith(marketPlaceField.value)
    );

    listenMarketPlaceChanges$.subscribe(value => {
      this.marketPlace.set(value);
    })

    combineLatest({
      marketPlace: listenMarketPlaceChanges$,
      code: codeField.valueChanges.pipe(
        startWith(codeField.value)
      )
    }).pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(() => {
      const [marketPlace, code] = [marketPlaceField.value, codeField.value];
      if (code) {
        const ticker = getMarketPlaceCode({ marketPlace, code });
        this.ticker.set(ticker);
        const asset = this.assets()[ticker];
        if (asset) {
          this.transactionForm.get('quote')?.setValue(asset.quote.value);
          return;
        }
        
        this.assetService.newDialog(ticker).subscribe(asset => {
          if (asset) {
            this.transactionForm.get('quote')?.setValue(asset.quote.value);
          }
        })
      }
    });
  }

  private listenAccountIdToFillAccountName() {
    const accountIdField = this.transactionForm.get("accountId") as FormControl;
    accountIdField.valueChanges.pipe(
      startWith(accountIdField.value),
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(accountName => this.accountName.set(accountName));
  }

  private listenQuantityAndQuoteToFillAmountValue() {
    const quantityField = this.transactionForm.get("quantity") as FormControl<number>;
    const quoteField = this.transactionForm.get("quote") as FormControl<number>;
    const amountField = this.transactionForm.get("amount") as FormControl<number>;

    quantityField.valueChanges.pipe(startWith(quantityField.value)).subscribe(() => {
      this.quantity.set(quantityField.value)
    })

    combineLatest([
      quantityField.valueChanges.pipe(startWith(quantityField.value)),
      quoteField.valueChanges.pipe(startWith(quoteField.value))
    ]).pipe(
      distinctUntilChanged()
    ).subscribe(() => {
      amountField.setValue(Number((quantityField.value * quoteField.value).toPrecision(6)), { emitEvent: false });
    })

    amountField.valueChanges.subscribe((amount) => {
      quoteField.setValue(Number((amount / quantityField.value).toPrecision(6)), { emitEvent: false });
    });
  }

  private listenTypeField() {
    const typeField = this.transactionForm.get('type');
    typeField?.valueChanges.subscribe(value => {
      this.transactionType.set(value);
      this.transactionTypeEnableFields();
    })
  }

  private transactionTypeEnableFields() {
    const quantityField = this.transactionForm.get('quantity') as FormControl;
    const quoteField = this.transactionForm.get('quote') as FormControl;
    const typeField = this.transactionForm.get('type');

    if ([InvestmentEnum.BUY, InvestmentEnum.SELL].includes(typeField?.value as InvestmentEnum)) {
      quantityField.enable();
      quoteField.enable();
    }
    else {
      quantityField.disable();
      quoteField.disable();
    }
  }

  accountNameDisplay = (id: string): string => this.balanceService.getAccounts()
    .filter(acc => acc.id === id)
    .map(acc => acc.account).find(_ => true) || '';

  toUpercase($event: Event) {
    const input = ($event.target) as HTMLInputElement;
    input.value = input.value.toLocaleUpperCase();
  }

  onSubmitRequest() {
    if (this.transactionForm.valid && this.allocationsIsValid) {
      const formData = this.transactionForm.value;
      const allocations = this.inputAllocations
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

function isAccountMatchedValidator(accounts: Signal<{ account: string, id: string }[]>): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return new Observable<ValidationErrors | null>(subscriber => {
      const value = control.value as string;
      if (!accounts().find(account => account.id === value)) {
        subscriber.next({ "accountNotFound": { value } });
      }
      else {
        subscriber.next(null);
      }
      subscriber.complete();
    })
  }
}