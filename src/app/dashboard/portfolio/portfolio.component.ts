import { Component, OnInit, viewChild } from '@angular/core';
import { MatAccordion, MatExpansionModule } from "@angular/material/expansion";
import { AllocationSummaryComponent } from '../../assets/allocation-summary/allocation-summary.component';
import { BalancesComponent } from '../../assets/balances/balances.component';
import { FinancialForecastSummaryComponent } from '../../assets/financial-forecast-summary/financial-forecast-summary.component';
import { PortfolioRegisterTableComponent } from '../../portfolio/portfolio-register-table/portfolio-register-table.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    MatExpansionModule,
    AllocationSummaryComponent,
    BalancesComponent,
    FinancialForecastSummaryComponent,
    PortfolioRegisterTableComponent,
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
