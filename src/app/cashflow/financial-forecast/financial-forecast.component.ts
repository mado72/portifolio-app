import { DatePipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { differenceInDays } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { CurrencyValue, ForecastDateItem, isTransactionDeposit, isTransactionExpense, TransactionEnum } from '../../model/domain.model';
import { TransactionStatus } from '../../model/investment.model';
import { BalanceService } from '../../service/balance.service';
import { ExchangeService } from '../../service/exchange.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionStatusPipe } from '../../utils/pipe/transaction-status.pipe';
import { TransactionTypePipe } from '../../utils/pipe/transaction-type.pipe';
import { FinancialForecastSummaryComponent } from "../financial-forecast-summary/financial-forecast-summary.component";

type DataSourceItem = ForecastDateItem & {calc: CurrencyValue, balanceId: string};

@Component({
  selector: 'app-financial-forecast',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    CurrencyComponent,
    TransactionStatusPipe,
    TransactionTypePipe,
    DatePipe,
    FinancialForecastSummaryComponent
],
  templateUrl: './financial-forecast.component.html',
  styleUrl: './financial-forecast.component.scss'
})
export class FinancialForecastComponent implements OnInit {

  private balanceService = inject(BalanceService);

  private exchangeService = inject(ExchangeService);

  onCheckboxChange = new EventEmitter<boolean>();


  /**
   * A computed property that generates a record of forecasted financial data for the current month.
   * 
   * The data is fetched from the `balanceService` using the default currency provided by the `sourceService`.
   * The forecasted items are sorted by their date in ascending order and then reduced into a record
   * where each key is a unique UUID and the value is the corresponding forecasted date item.
   * 
   * Important: The UUID is used to make a reference for the original transaction, that it would be useful for 
   * updates operations.
   * 
   * @returns A record where the keys are UUIDs and the values are `ForecastDateItem` objects,
   *          representing the forecasted financial data for the current month.
   */
  balanceSource = computed(() => 
    this.balanceService.getCurrentMonthForecast(this.exchangeService.currencyDefault())
      .filter(transaction=>transaction.type !== TransactionEnum.TRANSFER)
      .sort((a,b)=>differenceInDays(a.date,b.date))
      .reduce((acc, vl)=> {
        acc[uuid()] = {...vl};
        return acc;
      }, {} as Record<string, ForecastDateItem>)
  );

  datasource = computed (() => Object.entries(this.balanceSource())
    .map(([key, item]) => ({
      ...item,
      balanceId: key,
      calc: {
        ...item.value,
        value: isTransactionExpense(item.type) 
          ? - item.value.value 
          : isTransactionDeposit(item.type) 
            ? item.value.value : 0
      }
    } as DataSourceItem)));

  forecast = computed(() => this.datasource()
      .filter(transaction=>![TransactionStatus.COMPLETED, TransactionStatus.CANCELLED].includes(transaction.status))
      .reduce((acc, item) => acc += item.value.value, 0))

  displayedColumns = ["done", "description", "amount", "due", "type", "status"];

  ngOnInit(): void {
  }

  checkboxClicked(balanceId: string, checked: boolean): void {
    const transaction = this.balanceSource()[balanceId];
    if (!!transaction) {
      transaction.status = checked ? TransactionStatus.COMPLETED 
        : transaction.status === TransactionStatus.COMPLETED && transaction.scheduledRef
          ? TransactionStatus.PROGRAMING : TransactionStatus.PENDING  ;

      if (! transaction.id) {
        this.balanceService.addTransaction(transaction);
      } else {
        this.balanceService.updateTransaction(transaction.id, transaction)
      }
    }
  }

}
