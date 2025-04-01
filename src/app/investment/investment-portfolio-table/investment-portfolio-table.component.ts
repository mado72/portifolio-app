import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, Input, OnInit, Signal, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { TrendType } from '../../model/investment.model';
import { PortfolioAllocationType } from '../../model/source.model';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';
import { AssetCodePipe } from '../../utils/asset-code.pipe';
import { AssetTypePipe } from '../../utils/asset-type.pipe';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { PorfolioAllocationDataType, PortfolioAllocationDialogComponent } from '../portfolio-allocation-dialog/portfolio-allocation-dialog.component';

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

  private quoteService = inject(QuoteService);

  private investmentService = inject(InvestmentService);

  private portfolioService = inject(PortfolioService);

  private dialog = inject(MatDialog);

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'quantity', 'averagePrice', 'marketValue', 'profit', 'percPlanned', 'percAllocation'];

  @Input() editMode = false;

  @Input() portfolioId = '';

  @Input() currency = Currency.BRL;

  source!: Signal<Record<string,DatasourceRowType>>;

  datasource = computed(()=>Object.entries(this.source())
      .filter(([ticker, _])=> ticker != 'total')
      .map(([_, entry])=>{
        return entry;
      })
  );

  total = computed(() => this.source()['total']);

  portfolioName = signal('');

  ngOnInit(): void {
    this.source = computed(()=> {
      const assets = this.investmentService.assertsSignal();

      return Object.entries(this.portfolioService.portfolios()[this.portfolioId]?.allocations || [])
        .reduce((rec, [ticker, row])=>{
          rec[ticker] = {
            ...row,
            name: assets[ticker]?.name || ticker,
            trend: assets[ticker]?.trend || 'unchanged'
          };
          return rec;
        }, {} as Record<string, DatasourceRowType>);
    });

    const portfolio = this.portfolioService.portfolios()[this.portfolioId];
    this.portfolioName.set(portfolio.name);
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

          this.portfolioService.updatePortfolio(this.portfolioId, changes)
        }
      }
    });
  }

}
