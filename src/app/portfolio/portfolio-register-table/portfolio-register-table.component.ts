import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { PortfolioAllocationType, PortfolioType } from '../../model/source.model';
import { PortfolioService } from '../../service/portfolio-service';

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
    JsonPipe,
    PercentPipe,
    DecimalPipe
  ],
  templateUrl: './portfolio-register-table.component.html',
  styleUrl: './portfolio-register-table.component.scss'
})
export class PortfolioRegisterTableComponent {

  private portfolioService = inject(PortfolioService);

  readonly displayedColumns = ['name', 'percPlanned', 'percAllocation', 'marketValue', 'profit', 'performance'];

  // displayedColumns = ['id', 'name', 'actions'];
  detailDisplayedColumns = ['id', 'description'];

  total = computed(() => this.portfolioService.total())

  portfolios = computed(() => this.portfolioService.portfolioAllocation());

  expandedElement: DatasourceMasterType | null = null;

}
