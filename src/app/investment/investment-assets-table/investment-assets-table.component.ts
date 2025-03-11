import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { AssetAllocation } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { QuoteService } from '../../service/quote.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';

type ChangeType = 'up' | 'down' | 'none';
type AssetChaneType = AssetAllocation & ChangeType;
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

  datasource = this.investmentService.getAssets().pipe(
    map(result=>Object.values(result).map(asset=> ({...asset, changed: 'none'})))
  );


  readonly displayedColumns: string[] = ['name', 'code', 'marketPlace', 'type', 'quote', 'lastUpdate', 'controlByQty'];
}
