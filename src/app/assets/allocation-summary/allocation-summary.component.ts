import { PercentPipe } from '@angular/common';
import { Component, computed, inject, input, Input, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faExchange } from '@fortawesome/free-solid-svg-icons';
import { Currency } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { SourceService } from '../../service/source.service';

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

  private sourceService = inject(SourceService);

  private balanceService = inject(BalanceService);

  readonly faExchange = faExchange;

  currency = input<Currency>(this.sourceService.currencyDefault());

  summarySignal = signal(this.balanceService.getAllocationSummary(this.currency()));

  datasource = computed(()=>this.summarySignal()?.items || []);

  total = computed(()=>this.summarySignal()?.total);

  totalPercPlanned = computed(()=>this.datasource().reduce((acc,vl)=>acc+=vl.percentagePlanned,0));

  totalPercActual = computed(()=>this.datasource().reduce((acc,vl)=>{
    return acc+=vl.percentageActual;
  },0));

  displayedColumns: string[] = ['class', 'financial', 'percPlanned', 'percActual'];

  ngOnInit(): void {}

}
