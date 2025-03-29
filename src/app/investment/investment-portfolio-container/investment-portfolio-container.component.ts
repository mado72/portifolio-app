import { AfterViewInit, Component, inject, Input, OnInit, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Portfolio } from '../../model/portfolio.model';
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
export class InvestmentPortfolioContainerComponent implements OnInit, AfterViewInit {

  accordion = viewChild.required(MatAccordion);
  private portfolioService = inject(PortfolioService);

  portfolios: Partial<Portfolio>[] = [];

  @Input() editMode = false;

  ngOnInit(): void {
    this.portfolios = this.portfolioService.getAllPortfolios();
  }

  ngAfterViewInit(): void {
  }
  
  closeAll() {
    this.accordion().closeAll();
  }
  expandAll() {
    this.accordion().openAll();
  }
    
}
