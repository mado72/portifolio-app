import { AfterViewInit, Component, inject, OnInit, viewChild } from '@angular/core';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { Portfolio } from '../../model/portfolio.model';
import { InvestmentService } from '../../service/investment.service';
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';

@Component({
  selector: 'app-investment-portfolio-container',
  standalone: true,
  imports: [
    MatExpansionModule,
    InvestmentPortfolioTableComponent
  ],
  templateUrl: './investment-portfolio-container.component.html',
  styleUrl: './investment-portfolio-container.component.scss'
})
export class InvestmentPortfolioContainerComponent implements OnInit, AfterViewInit {

  accordion = viewChild.required(MatAccordion);
  private investmentService = inject(InvestmentService);
  
  portfolios: Partial<Portfolio>[] = [];
  
  
  ngOnInit(): void {
    this.investmentService.getPortfolioSummary().subscribe(portfolios => {
      this.portfolios = portfolios;
    });
  }
  
  ngAfterViewInit(): void {
    this.accordion().openAll();
  }
}
