import { Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { AccountTypeEnum, Currency } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
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

  private balanceService = inject(BalanceService);

  initialBalance = 0;

  forecastBalance = 0;

  inOutTotal = 0;

  datasource = computed(()=>{
    let balance = this.balanceService.getBalancesSummarized(Currency.BRL, [AccountTypeEnum.INVESTMENT, AccountTypeEnum.LOAN]);
    const forecastSummary = this.balanceService.getForecastSummary(Currency.BRL);

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
