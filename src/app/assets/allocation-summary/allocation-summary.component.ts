import { Component, inject, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { map } from 'rxjs';
import { CurrencyComponent } from '../../utils/currency/currency.component';

@Component({
  selector: 'app-allocation-summary',
  standalone: true,
  imports: [
    MatTableModule,
    CurrencyComponent
  ],
  templateUrl: './allocation-summary.component.html',
  styleUrl: './allocation-summary.component.scss'
})
export class AllocationSummaryComponent {

  private balanceService = inject(BalanceService);

  @Input() currency = Currency.BRL;

  allocationsSummary = this.balanceService.getAllocationSummary(this.currency);

  datasource = this.allocationsSummary.pipe(
    map(data=> data.items)
  )

  total = this.allocationsSummary.pipe(
    map(data=> data.total)
  )

  displayedColumns: string[] = ['class', 'financial', 'percPlanned', 'percActual'];
}
