import { Component, OnInit, viewChild } from '@angular/core';
import { MatAccordion, MatExpansionModule } from "@angular/material/expansion";
import { BalancesComponent } from '../../cashflow/balances/balances.component';
import { FinancialForecastSummaryComponent } from '../../cashflow/financial-forecast-summary/financial-forecast-summary.component';
import { PortfolioRegisterTableComponent } from '../../portfolio/portfolio-register-table/portfolio-register-table.component';
import { SummarizePortfolioClassComponent } from "../../portfolio/summarize-portfolio-class/summarize-portfolio-class.component";

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    MatExpansionModule,
    BalancesComponent,
    FinancialForecastSummaryComponent,
    PortfolioRegisterTableComponent,
    SummarizePortfolioClassComponent
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
