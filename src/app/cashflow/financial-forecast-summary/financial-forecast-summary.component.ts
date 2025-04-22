import { Component, computed, inject, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { AccountTypeEnum } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { ExchangeService } from '../../service/exchange.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';

@Component({
  selector: 'app-financial-forecast-summary',
  standalone: true,
  imports: [
    MatTableModule,
    CurrencyComponent
  ],
  templateUrl: './financial-forecast-summary.component.html',
  styleUrl: './financial-forecast-summary.component.scss'
})
export class FinancialForecastSummaryComponent {

  private exchangeService = inject(ExchangeService);

  private balanceService = inject(BalanceService);

  caption = input<string>('');

  currency = this.exchangeService.currencyDefault();

  initialBalance = computed(() => this.balanceService.getBalancesSummarized(
    Object.values(this.balanceService.getAllBalances()),
    this.exchangeService.currencyDefault(),
    [AccountTypeEnum.INVESTMENT, AccountTypeEnum.LOAN]));

  forecastSummary = computed(() => this.balanceService.getForecastSummary(this.exchangeService.currencyDefault()))

  cashflowResult = computed(() => this.forecastSummary().reduce((acc, entry) => acc + entry.amount, 0));

  forecastResult = computed(() => this.initialBalance() + this.cashflowResult())

  summarized = computed(() => 
    this.forecastSummary().reduce((acc, entry) => {
      acc.items.push({
        period: entry.start !== entry.end ? `${entry.start} - ${entry.end}` : `${entry.start}`,
        summary: entry.amount,
        balance: (acc.balance += entry.amount)
      });
      return acc;
    },
      {
        balance: this.initialBalance(),
        items: [] as { period: string, summary: number, balance: number }[]
      }
    ));

  dataSource = computed(() => this.summarized().items)

  displayedColumn = ['period', 'summary', 'balance'];

}
