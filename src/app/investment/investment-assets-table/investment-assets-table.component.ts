import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { AssetAllocation } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { QuoteService } from '../../service/quote.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';

@Component({
  selector: 'app-investment-assets-table',
  standalone: true,
  imports: [
    MatTableModule,
    CurrencyComponent,
    DatePipe
  ],
  templateUrl: './investment-assets-table.component.html',
  styleUrl: './investment-assets-table.component.scss'
})
export class InvestmentAssetsTableComponent {

  private investmentService = inject(InvestmentService);

  private quoteService = inject(QuoteService);

  asserts = this.investmentService.assertsSignal;

  datasource = computed(()=> {
    const asserts = Object.values(this.asserts());
    return asserts;
  })
  
  readonly displayedColumns: string[] = ['name', 'code', 'marketPlace', 'type', 'quote', 'trend', 'lastUpdate', 'controlByQty'];
}
