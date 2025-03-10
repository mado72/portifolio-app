import { Component, inject } from '@angular/core';
import { InvestmentService } from '../../service/investment.service';
import { MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
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

  datasource = this.investmentService.getAssets();

  readonly displayedColumns: string[] = ['name', 'code', 'marketPlace', 'type', 'quote', 'lastUpdate', 'controlByQty'];

}
