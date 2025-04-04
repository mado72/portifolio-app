import { Component, OnInit, viewChild } from '@angular/core';
import { MatAccordion, MatExpansionModule } from "@angular/material/expansion";
import { AllocationSummaryComponent } from '../../assets/allocation-summary/allocation-summary.component';
import { BalancesComponent } from '../../assets/balances/balances.component';
import { FinancialForecastSummaryComponent } from '../../assets/financial-forecast-summary/financial-forecast-summary.component';
import { InvestmentPortfolioContainerComponent } from '../../portfolio/investment-portfolio-container/investment-portfolio-container.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    MatExpansionModule,
    AllocationSummaryComponent,
    BalancesComponent,
    FinancialForecastSummaryComponent,
    InvestmentPortfolioContainerComponent,
],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit{

  accordion = viewChild.required(MatAccordion);

  ngOnInit(): void {
    this.accordion().openAll();
  }
}
