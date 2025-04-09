import { Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { AccountTypeEnum } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { SourceService } from '../../service/source.service';
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

  private sourceService = inject(SourceService);

  private balanceService = inject(BalanceService);

  initialBalance = 0;

  forecastBalance = 0;

  inOutTotal = 0;

  datasource = computed(() => {
    let balance = this.balanceService.getBalancesSummarized(this.sourceService.currencyDefault(),
      [AccountTypeEnum.INVESTMENT, AccountTypeEnum.LOAN]);

    const forecastSummary = this.balanceService.getForecastSummary(this.sourceService.currencyDefault());

    this.forecastBalance = 0;
    this.initialBalance = balance;
    this.inOutTotal = forecastSummary.reduce((acc, entry) => acc + entry.amount, 0);
    const output = forecastSummary.map(entry => ({
      period: entry.start !== entry.end ? `${entry.start} - ${entry.end}` : `${entry.start}`,
      summary: entry.amount,
      balance: (balance += entry.amount)
    }));
    this.forecastBalance = balance;
    return output;
  })

  displayedColumn = ['period', 'summary', 'balance'];

}
