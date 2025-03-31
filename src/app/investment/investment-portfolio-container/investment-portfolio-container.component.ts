import { AfterViewInit, Component, inject, Input, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioService } from '../../service/portfolio-service';
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';

@Component({
  selector: 'app-investment-portfolio-container',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    InvestmentPortfolioTableComponent
  ],
  templateUrl: './investment-portfolio-container.component.html',
  styleUrl: './investment-portfolio-container.component.scss'
})
export class InvestmentPortfolioContainerComponent implements AfterViewInit {

  accordion = viewChild.required(MatAccordion);
  private portfolioService = inject(PortfolioService);

  portfolios = this.portfolioService.getAllPortfolios();

  @Input() editMode = false;

  ngAfterViewInit(): void {
  }
  
  closeAll() {
    this.accordion().closeAll();
  }
  expandAll() {
    this.accordion().openAll();
  }
    
}
