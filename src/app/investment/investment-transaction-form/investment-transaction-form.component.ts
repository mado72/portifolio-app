import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { provideAppDateAdapter, PTBR_FORMATS } from '../../utils/pipe/app-date-adapter.adapter';
import { PortfolioService } from '../../service/portfolio-service';
import { debounceTime, distinctUntilChanged, takeLast } from 'rxjs';

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
    JsonPipe
  ],
  providers: [
    provideAppDateAdapter(PTBR_FORMATS)
  ],
  templateUrl: './investment-transaction-form.component.html',
  styleUrl: './investment-transaction-form.component.scss'
})
export class InvestmentTransactionFormComponent {

  private portfolioService = inject(PortfolioService);

  marketPlaces = ['NYSE', 'NASDAQ', 'B3', 'LSE']; // Exemplo de MarketPlaces
  currencies = ['BRL', 'USD', 'EUR']; // Moedas disponíveis
  transactionTypes = ['BUY', 'SELL', 'REDEMPTION', 'SUBSCRIPTION']; // Tipos de transação

  private fb = inject(FormBuilder);

  ticker = signal<string | null>(null);

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
    ticker: ['', Validators.required],
    date: [null as unknown as Date, Validators.required],
    accountId: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(1)]],
    quote: [0, [Validators.required, Validators.min(0)]],
    amount: [0, [Validators.required, Validators.min(0)]],
    type: ['', Validators.required],
    brokerage: [0, [Validators.min(0)]],
    allocations: this.fb.array([] as number[])
  });

  constructor() {
    const portfolios = this.portfolios();
    this.generateAllocationControls(portfolios);

    effect(() => {
      const portfolios = this.portfolios();
      this.generateAllocationControls(portfolios);
    })

    this.transactionForm.get("ticker")?.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(ticker=>this.ticker.set(ticker));
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
    return "";
  }

  get allocationArray() {
    return this.transactionForm.get("allocations") as FormArray;
  }

}
