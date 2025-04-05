import { animate, state, style, transition, trigger } from '@angular/animations';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { PortfolioAllocationsArrayItemType, PortfolioAllocationType, PortfolioType } from '../../model/source.model';
import { PortfolioService } from '../../service/portfolio-service';
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';

type DatasourceMasterType = Omit<PortfolioType, "allocations" | "percAllocation"> & {
  allocations: PortfolioAllocationType[];
  percAllocation: number;
}
@Component({
  selector: 'app-portfolio-register-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    FaIconComponent,
    PercentPipe,
    DecimalPipe,
    InvestmentPortfolioTableComponent
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0', maxHeight: '0', opacity: '0' })),
      state('expanded', style({ height: '*', maxHeight: '', opacity: '1'})),
      transition('expanded <=> collapsed', animate('1s cubic-bezier(.28,.5,.83,.67)')),
      transition('collapsed <=> expanded', animate('1s cubic-bezier(.17,.67,.83,.67)')),
    ]),
  ],
  templateUrl: './portfolio-register-table.component.html',
  styleUrl: './portfolio-register-table.component.scss'
})
export class PortfolioRegisterTableComponent {

  private portfolioService = inject(PortfolioService);

  readonly iconClose = faChevronRight;

  readonly iconOpen = faChevronDown;

  readonly displayedColumns = ['name', 'percPlanned', 'percAllocation', 'marketValue', 'profit', 'performance'];

  // displayedColumns = ['id', 'name', 'actions'];
  detailDisplayedColumns = ['id', 'description'];

  total = computed(() => this.portfolioService.total())

  portfolios = computed(() => this.portfolioService.portfolioAllocation());

  expandedElement: DatasourceMasterType | null = null;
  
  trackBy(_: number, item: PortfolioAllocationsArrayItemType) {
    return item.id;
  }

  expanded : string[] = [];

  isExpanded(portfolio: PortfolioAllocationsArrayItemType) {
    return this.expanded.includes(portfolio.id);
  }

  toggleExpanded(portfolio: PortfolioAllocationsArrayItemType) {
    if (this.isExpanded(portfolio)) {
      this.expanded = this.expanded.filter(id => id !== portfolio.id);
    } else {
      this.expanded.push(portfolio.id);
    }
  }
}
