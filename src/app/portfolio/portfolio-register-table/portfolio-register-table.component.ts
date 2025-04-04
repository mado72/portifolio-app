import { Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { SourceService } from '../../service/source.service';
import { PortfolioService } from '../../service/portfolio-service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-portfolio-register-table',
  standalone: true,
  imports: [
    MatTableModule,
    JsonPipe
  ],
  templateUrl: './portfolio-register-table.component.html',
  styleUrl: './portfolio-register-table.component.scss'
})
export class PortfolioRegisterTableComponent {

  private portfolioService = inject(PortfolioService);

  readonly displayColumns = ['name', 'currency', 'percPlanned', 'percAllocation', 'profit', 'performance'];

  portfolios = computed(() => {
    return this.portfolioService.getAllPortfolios();
    // Object.entries(this.portfolioService.portfolios()).reduce((acc, [id, portfolio])=>{
    //   Object.entries(portfolio.allocations).reduce((accAlloc, [ticker, alloc])=>{
    //     alloc.
    //     return accAlloc;
    //   }, {} as any)
    //   return acc;
    // }, {} as any)
  })
}
