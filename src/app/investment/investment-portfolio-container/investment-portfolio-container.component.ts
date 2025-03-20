import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { InvestmentService } from '../../service/investment.service';
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';
import { Portfolio } from '../../model/portfolio.model';

@Component({
  selector: 'app-investment-portfolio-container',
  standalone: true,
  imports: [
    MatCardModule,
    InvestmentPortfolioTableComponent
  ],
  templateUrl: './investment-portfolio-container.component.html',
  styleUrl: './investment-portfolio-container.component.scss'
})
export class InvestmentPortfolioContainerComponent {

  private investmentService = inject(InvestmentService);

  portfolios: Partial<Portfolio>[] = [];

  constructor() {
    this.investmentService.getPortfolioSummary().subscribe(portfolios => {
      return this.portfolios = portfolios;
    });

  }
}
