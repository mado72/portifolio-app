import { Component, computed, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { Currency, isStatementExpense } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';

@Component({
  selector: 'app-financial-forecast',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    CurrencyComponent
  ],
  templateUrl: './financial-forecast.component.html',
  styleUrl: './financial-forecast.component.scss'
})
export class FinancialForecastComponent implements OnInit {

  private balanceService = inject(BalanceService);

  onCheckboxChange = new EventEmitter<boolean>();

  data = toSignal(this.balanceService.getCurrentMonthForecast(Currency.BRL).pipe(
    map(items=>{
      return items.map(item=>({
        ...item,
        value: {
          ...item.value,
          amount: item.value.amount = isStatementExpense(item.type) ? - item.value.amount : item.value.amount
        }
      }))
    })
  ));

  datasource = computed(()=>this.data() || [])

  total = computed(()=>this.datasource().reduce((acc,item)=>acc += item.value.amount, 0))

  // Signal to update computed value for notDone property
  forceUpdateSig = signal<boolean>(false);

  notDone = computed(()=>this.datasource()
      .filter((item) => !item.done || (this.forceUpdateSig() && false)));

  forecast = computed(()=>this.notDone().reduce((acc,item)=>acc += item.value.amount, 0))

  displayedColumns = ["movement", "due", "amount", "done"];
  
  ngOnInit(): void {
  }

  checkboxClicked(id: number, checked: boolean): void {
    this.forceUpdateSig.set(!this.forceUpdateSig()); // force update
  }

}
