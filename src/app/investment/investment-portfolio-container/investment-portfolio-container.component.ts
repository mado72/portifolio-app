import { AfterViewInit, Component, inject, Input, OnInit, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { AssetValueRecord, Portfolio } from '../../model/portfolio.model';
import { InvestmentService } from '../../service/investment.service';
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';
import { Asset, AssetAllocation } from '../../model/investment.model';

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
  private investmentService = inject(InvestmentService);

  portfolios: Partial<Portfolio>[] = [];

  @Input() editMode = false;

  ngOnInit(): void {
    this.investmentService.getPortfolioSummary().subscribe(portfolios => {
      this.portfolios = portfolios;
    });
  }

  ngAfterViewInit(): void {
  }
  
  closeAll() {
    this.accordion().closeAll();
  }
  expandAll() {
    this.accordion().openAll();
  }

  rowSelected(row: AssetAllocation&AssetValueRecord) {
    console.log(row)
  }
    
}
