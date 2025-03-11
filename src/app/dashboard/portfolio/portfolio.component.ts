import { Component } from '@angular/core';
import { AllocationSummaryComponent } from '../../assets/allocation-summary/allocation-summary.component';
import { BalancesComponent } from '../../assets/balances/balances.component';
import { FinancialForecastSummaryComponent } from '../../assets/financial-forecast-summary/financial-forecast-summary.component';
import { InvestmentPortfolioContainerComponent } from "../../investment/investment-portfolio-container/investment-portfolio-container.component";

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    AllocationSummaryComponent,
    BalancesComponent,
    FinancialForecastSummaryComponent,
    InvestmentPortfolioContainerComponent
],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent {

}
