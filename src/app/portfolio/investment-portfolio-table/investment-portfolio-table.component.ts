import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, input, Input, OnInit, Signal, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { PortfolioAllocationType, TrendType } from '../../model/source.model';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';
import { AssetCodePipe } from '../../utils/asset-code.pipe';
import { AssetTypePipe } from '../../utils/asset-type.pipe';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { PorfolioAllocationDataType, PortfolioAllocationDialogComponent } from '../portfolio-allocation-dialog/portfolio-allocation-dialog.component';
import { SourceService } from '../../service/source.service';

type DatasourceRowType = PortfolioAllocationType & {ticker: string, name: string, trend: TrendType};

@Component({
  selector: 'app-investment-portfolio-table',
  standalone: true,
  imports: [
    MatTableModule,
    DecimalPipe,
    PercentPipe,
    CurrencyComponent,
    AssetTypePipe,
    AssetCodePipe,
    JsonPipe
  ],
  templateUrl: './investment-portfolio-table.component.html',
  styleUrl: './investment-portfolio-table.component.scss'
})
export class InvestmentPortfolioTableComponent implements OnInit {

  private sourceService = inject(SourceService);

  private investmentService = inject(InvestmentService);

  private portfolioService = inject(PortfolioService);

  private dialog = inject(MatDialog);

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'quantity', 'averagePrice', 'marketValue', 'profit', 'percPlanned', 'percAllocation'];

  editMode = input<boolean>(false);

  portfolioId = input<string>('', {alias: 'portfolioId'});

  currency = input<Currency>(this.sourceService.currencyDefault());

  source!: Signal<Record<string,DatasourceRowType>>;

  datasource = computed(() => {
    return Object.values(this.portfolioService.portfolios()[this.portfolioId()]?.allocations || {});
  });

  total = computed(() => this.portfolioService.portfolios()[this.portfolioId()]?.total || {});

  portfolioName = computed(() => {
    return this.portfolioService.portfolios()[this.portfolioId()]?.name || '';
  });

  ngOnInit(): void {
  }

  selectRow(row: DatasourceRowType) {
    const asset = this.investmentService.assertsSignal()[row.ticker];

    const data: PorfolioAllocationDataType = {
      ticker: row.ticker,
      asset,
      portfolio: this.portfolioName(),
      quantity: row.quantity,
      percent: row.percPlanned
    }
    const dialogRef = this.dialog.open(PortfolioAllocationDialogComponent, { data });

    dialogRef.afterClosed().subscribe((result: PorfolioAllocationDataType) => {
      if (result) {
        const delta = result.quantity - data.quantity;
        if (delta !== 0) {
          const changes = {
            allocations: [{
              ticker: result.ticker,
              quantity: result.quantity,
              percPlanned: result.percent,
            }]
          }

          this.portfolioService.updatePortfolio(this.portfolioId(), changes)
        }
      }
    });
  }

}
