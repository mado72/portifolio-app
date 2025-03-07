import { PercentPipe } from '@angular/common';
import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faExchange } from '@fortawesome/free-solid-svg-icons';
import { Currency } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';

@Component({
  selector: 'app-allocation-summary',
  standalone: true,
  imports: [
    MatTableModule,
    CurrencyComponent,
    PercentPipe,
    FaIconComponent
  ],
  templateUrl: './allocation-summary.component.html',
  styleUrl: './allocation-summary.component.scss'
})
export class AllocationSummaryComponent implements OnInit {

  private balanceService = inject(BalanceService);

  readonly faExchange = faExchange;

  @Input() currency = Currency.BRL;

  summarySignal = toSignal(this.balanceService.getAllocationSummary(this.currency));

  datasource = computed(()=>this.summarySignal()?.items || []);

  total = computed(()=>this.summarySignal()?.total);

  totalPercPlanned = computed(()=>this.datasource().reduce((acc,vl)=>acc+=vl.percentagePlanned,0));

  totalPercActual = computed(()=>this.datasource().reduce((acc,vl)=>{
    return acc+=vl.percentageActual;
  },0));

  displayedColumns: string[] = ['class', 'financial', 'percPlanned', 'percActual'];

  ngOnInit(): void {
    console.log(this.summarySignal())
  }

}
