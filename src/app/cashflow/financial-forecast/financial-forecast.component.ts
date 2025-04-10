import { DatePipe, JsonPipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { differenceInDays } from 'date-fns';
import { CurrencyAmount, ForecastDateItem, isTransactionDeposit, isTransactionExpense } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { SourceService } from '../../service/source.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionStatusPipe } from '../../utils/pipe/transaction-status.pipe';
import { TransactionTypePipe } from '../../utils/pipe/transaction-type.pipe';
import { TransactionStatus } from '../../model/investment.model';
import { v4 as uuid } from 'uuid';
import { FinancialForecastSummaryComponent } from "../financial-forecast-summary/financial-forecast-summary.component";

type DataSourceItem = ForecastDateItem & {calc: CurrencyAmount, balanceId: string};

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
    JsonPipe,
    FinancialForecastSummaryComponent
],
  templateUrl: './financial-forecast.component.html',
  styleUrl: './financial-forecast.component.scss'
})
export class FinancialForecastComponent implements OnInit {

  private balanceService = inject(BalanceService);

  private sourceService = inject(SourceService);

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
    this.balanceService.getCurrentMonthForecast(this.sourceService.currencyDefault()).sort((a,b)=>differenceInDays(a.date,b.date))
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
        amount: isTransactionExpense(item.type) 
          ? - item.value.amount 
          : isTransactionDeposit(item.type) 
            ? item.value.amount : 0
      }
    } as DataSourceItem)));

  total = computed(() => this.datasource().reduce((acc, item) => acc += item.value.amount, 0))

  // Signal to update computed value for notDone property
  forceUpdateSig = signal<boolean>(false);

  forecast = computed(() => this.datasource()
    .filter((item) => !item.done || (this.forceUpdateSig() && false)) // force update
    .reduce((acc, item) => acc += item.value.amount, 0))

  displayedColumns = ["description", "type", "status", "due", "amount", "done"];

  ngOnInit(): void {
  }

  checkboxClicked(balanceId: string, checked: boolean): void {
    const transaction = this.balanceSource()[balanceId];
    if (!!transaction) {
      transaction.status = checked ? TransactionStatus.COMPLETED 
        : transaction.status === TransactionStatus.COMPLETED 
          ? TransactionStatus.CANCELLED : TransactionStatus.PENDING  ;

      if (! transaction.id) {
        this.balanceService.addTransaction(transaction);
      } else {
        this.balanceService.updateTransaction(transaction.id, transaction)
      }
    }
    this.forceUpdateSig.set(!this.forceUpdateSig()); // force update
  }

}
