import { Component, computed, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { isStatementDeposit, isStatementExpense } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { SourceService } from '../../service/source.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { DatePipe, JsonPipe } from '@angular/common';
import { differenceInDays, isBefore } from 'date-fns';

@Component({
  selector: 'app-financial-forecast',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    CurrencyComponent,
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
        amount: item.value.amount = isStatementExpense(item.type) ? - item.value.amount : isStatementDeposit(item.type) ? item.value.amount : 0
      }
    })));

  total = computed(() => this.datasource().reduce((acc, item) => acc += item.value.amount, 0))

  // Signal to update computed value for notDone property
  forceUpdateSig = signal<boolean>(false);

  notDone = computed(() => this.datasource()
    .filter((item) => !item.done || (this.forceUpdateSig() && false)));

  forecast = computed(() => this.notDone().reduce((acc, item) => acc += item.value.amount, 0))

  displayedColumns = ["description", "type", "due", "amount", "done"];

  ngOnInit(): void {
  }

  checkboxClicked(id: number, checked: boolean): void {
    this.forceUpdateSig.set(!this.forceUpdateSig()); // force update
  }

}
