import { Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { InvestmentService } from '../../service/investment.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Currency } from '../../model/domain.model';

@Component({
  selector: 'app-investment-portfolio-table',
  standalone: true,
  imports: [
    MatTableModule,
    CurrencyComponent
  ],
  templateUrl: './investment-portfolio-table.component.html',
  styleUrl: './investment-portfolio-table.component.scss'
})
export class InvestmentPortfolioTableComponent {

  private investmentService = inject(InvestmentService);

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'quantity', 'marketValue', 'percPlanned', 'percAllocation'];

  portfolioId = 'Portfolio2';

  portfolio = toSignal(this.investmentService.getPortfolio(this.portfolioId));

  datasource = computed(() => this.portfolio()?.assets || []);

  get portfolioCurrency() {
    return this.portfolio()?.currency || Currency.BRL;
  }

}
