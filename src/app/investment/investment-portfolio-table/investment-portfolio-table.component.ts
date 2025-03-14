import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { AssetPosition, Portfolio } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { getMarketPlaceCode } from '../../service/quote.service';
import { AssetCodePipe } from '../../util/asset-code.pipe';
import { AssetTypePipe } from '../../util/asset-type.pipe';
import { CurrencyComponent } from '../../utils/currency/currency.component';

@Component({
  selector: 'app-investment-portfolio-table',
  standalone: true,
  imports: [
    MatTableModule,
    DecimalPipe,
    PercentPipe,
    CurrencyComponent,
    AssetTypePipe,
    AssetCodePipe
  ],
  templateUrl: './investment-portfolio-table.component.html',
  styleUrl: './investment-portfolio-table.component.scss'
})
export class InvestmentPortfolioTableComponent implements OnInit{

  private investmentService = inject(InvestmentService);

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'quantity', 'marketValue', 'percPlanned', 'percAllocation'];

  @Input() portfolioId = '';

  portfolio = signal<Portfolio | undefined>(undefined);

  datasource = computed(() => Object.values(this.portfolio()?.assets || {}));

  total = computed(() => this.datasource().reduce((acc, item) => {
    acc.marketValue += item.marketValue;
    acc.percPlanned += item.percPlanned;
    return acc;
  }, {marketValue: 0, percPlanned: 0} as Pick<AssetPosition, "marketValue" | "percPlanned">))

  percAllocation = computed(() => this.datasource()
      .reduce((acc, item) => {
        const code = getMarketPlaceCode(item.marketPlace, item.code);
        const perc = item.marketValue / this.total().marketValue;
        acc[code]= perc
        acc["total"] += perc;
        return acc;
      }, {"total": 0} as Record<string,number>))

  get portfolioCurrency() {
    return this.portfolio()?.currency || Currency.BRL;
  }

  ngOnInit(): void {
    this.investmentService.getPortfolio(this.portfolioId).subscribe(porfolio => {
      this.portfolio.set(porfolio);
    });
    
  }

}
