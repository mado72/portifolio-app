import { Component, inject } from '@angular/core';
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';
import { InvestmentService } from '../../service/investment.service';
import { Portfolio } from '../../model/investment.model';
import { MatCardModule } from '@angular/material/card'

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

  portfolios: Portfolio[] = [];

  constructor() {
    this.investmentService.getPortfolioNames().subscribe(portfolios => this.portfolios = portfolios);

  }
}
