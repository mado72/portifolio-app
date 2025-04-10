import { DatePipe, JsonPipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { differenceInDays } from 'date-fns';
import { isTransactionDeposit, isTransactionExpense } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { SourceService } from '../../service/source.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionStatusPipe } from '../../utils/pipe/transaction-status.pipe';
import { TransactionTypePipe } from '../../utils/pipe/transaction-type.pipe';

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
    JsonPipe
  ],
  templateUrl: './financial-forecast.component.html',
  styleUrl: './financial-forecast.component.scss'
})
export class FinancialForecastComponent implements OnInit {

  private balanceService = inject(BalanceService);

  private sourceService = inject(SourceService);

  onCheckboxChange = new EventEmitter<boolean>();

  datasource = computed (() => this.balanceService.getCurrentMonthForecast(this.sourceService.currencyDefault()).sort((a,b)=>differenceInDays(a.date,b.date))
    .map(item => ({
      ...item,
      value: {
        ...item.value,
        amount: item.value.amount = isTransactionExpense(item.type) ? - item.value.amount : isTransactionDeposit(item.type) ? item.value.amount : 0
      }
    })));

  total = computed(() => this.datasource().reduce((acc, item) => acc += item.value.amount, 0))

  // Signal to update computed value for notDone property
  forceUpdateSig = signal<boolean>(false);

  notDone = computed(() => this.datasource()
    .filter((item) => !item.done || (this.forceUpdateSig() && false)));

  forecast = computed(() => this.notDone().reduce((acc, item) => acc += item.value.amount, 0))

  displayedColumns = ["description", "type", "status", "due", "amount", "done"];

  ngOnInit(): void {
  }

  checkboxClicked(id: number, checked: boolean): void {
    this.forceUpdateSig.set(!this.forceUpdateSig()); // force update
  }

}
