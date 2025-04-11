import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { provideAppDateAdapter, PTBR_FORMATS } from '../../utils/pipe/app-date-adapter.adapter';
import { PortfolioService } from '../../service/portfolio-service';
import { combineLatest, debounceTime, distinctUntilChanged, Observable, startWith, takeLast, tap } from 'rxjs';
import { AssetService } from '../../service/asset.service';
import { getMarketPlaceCode, QuoteService } from '../../service/quote.service';
import { InvestmentEnum } from '../../model/investment.model';
import { InvestmentTypePipe } from '../../utils/pipe/investment-type.pipe';
import { BalanceService } from '../../service/balance.service';

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
    JsonPipe
  ],
  providers: [
    provideAppDateAdapter(PTBR_FORMATS)
  ],
  templateUrl: './investment-transaction-form.component.html',
  styleUrl: './investment-transaction-form.component.scss'
})
export class InvestmentTransactionFormComponent {

  private quoteService = inject(QuoteService);

  private portfolioService = inject(PortfolioService);

  private balanceService = inject(BalanceService);

  currencies = ['BRL', 'USD', 'EUR']; // Moedas disponíveis
  transactionTypes = Object.keys(InvestmentEnum); // Tipos de transação

  private fb = inject(FormBuilder);

  assets = this.quoteService.quotes;

  marketPlaces = computed(() => {
    const assets = this.assets();
    const marketPlaces = new Set(Object.values(assets).map(asset=>asset.marketPlace))
    return Array.from(marketPlaces);
  })
  //['NYSE', 'NASDAQ', 'B3', 'LSE']; // Exemplo de MarketPlaces
  

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
    accountId: ['', Validators.required, isAccountMatched(this.accounts())],
    quantity: [0, [Validators.required, Validators.min(1)]],
    quote: [0, [Validators.required, Validators.min(0)]],
    amount: [0, [Validators.required, Validators.min(0)]],
    type: ['', Validators.required],
    brokerage: [0, [Validators.min(0)]],
    allocations: this.fb.array([] as number[])
  });

  optionsCode = computed(() => { 
    const ticker = this.ticker();
    if (! ticker) return [];
    return Object.keys(this.assets()).filter(key=>key.startsWith(ticker))
  });

  optionsAccount = computed(() => {
    const accountName = this.accountName();
    return this.accounts()
      .filter(acc=>acc.account.toLocaleLowerCase().includes(accountName.toLocaleLowerCase()));
  });

  accountNameDisplay = (id: string) : string => this.balanceService.getAccounts()
      .filter(acc=>acc.id === id)
      .map(acc=>acc.account).find(_=>true) || '';

  constructor() {
    const portfolios = this.portfolios();
    this.generateAllocationControls(portfolios);

    effect(() => {
      const portfolios = this.portfolios();
      this.generateAllocationControls(portfolios);
    })

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
    ).subscribe((ticker)=>
      this.ticker.set(getMarketPlaceCode(ticker))
    );

    const accountIdField = this.transactionForm.get("accountId") as FormControl;
    accountIdField.valueChanges.pipe(
      startWith(accountIdField.value),
      debounceTime(1000),
      distinctUntilChanged()
    )
    .subscribe(accountName=>this.accountName.set(accountName));
  }

  ngOnInit() {
  }

  generateAllocationControls(portfolios: {id: string; name: string; allocation: number;}[]) {
    const allocations = portfolios.map(portfolio => portfolio.allocation);

    if (allocations.length !== this.allocationArray.length) {
      this.allocationArray.clear();
  
      for (const allocation of allocations) {
        this.allocationArray.push(this.fb.control(allocation, [Validators.required, Validators.min(0)]))
      }
    }
    else {
      this.allocationArray.patchValue(allocations);
    }
}

  onSubmit() {
    if (this.transactionForm.valid) {
      console.log(this.transactionForm.value);
    }
  }
  
  displayFn(code: string): string {
    const marketPlace = this.transactionForm?.value?.marketPlace;
    return getMarketPlaceCode({marketPlace: marketPlace || '', code});
  }

  get allocationArray() {
    return this.transactionForm.get("allocations") as FormArray;
  }

  toUpercase($event: Event) {
    const input = ($event.target) as HTMLInputElement;
    input.value = input.value.toLocaleUpperCase();
  }
    
}
function isAccountMatched(accounts: {account: string, id: string}[]): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return new Observable<ValidationErrors | null>(subscriber=>{
      const value = control.value as string;
      if (! accounts.find(account=>account.id===value)) {
        subscriber.next({"accountNotFound": {value}});
      }
      else {
        subscriber.next(null);
      }
      subscriber.complete();
    })
  }
}

