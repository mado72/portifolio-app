import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, Signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { PortfolioAllocationsArrayItemType, PortfolioAllocationType, PortfolioType, SummarizedDataType, TrendType } from '../../model/source.model';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { SourceService } from '../../service/source.service';
import { AssetTypePipe } from '../../utils/pipe/asset-type.pipe';
import { PorfolioAllocationDataType, PortfolioAllocationDialogComponent } from '../portfolio-allocation-dialog/portfolio-allocation-dialog.component';
import { QuoteService } from '../../service/quote.service';
import { ExchangeComponent } from "../../utils/component/exchange/exchange.component";

type DatasourceInputType = PortfolioAllocationType & {ticker: string, name: string, trend: TrendType};

@Component({
  selector: 'app-investment-portfolio-table',
  standalone: true,
  imports: [
    MatTableModule,
    DecimalPipe,
    PercentPipe,
    AssetTypePipe,
    JsonPipe,
    ExchangeComponent
],
  templateUrl: './investment-portfolio-table.component.html',
  styleUrl: './investment-portfolio-table.component.scss'
})
export class InvestmentPortfolioTableComponent {

  private sourceService = inject(SourceService);

  private investmentService = inject(InvestmentService);

  private quoteService = inject(QuoteService);

  private portfolioService = inject(PortfolioService);

  private dialog = inject(MatDialog);

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'quantity', 'averagePrice', 'marketValue', 'profit', 'percPlanned', 'percAllocation'];

  exchangeView = computed(() => this.quoteService.exchangeView());

  editable = input<boolean>(false);

  currency = input<Currency>(this.sourceService.currencyDefault());

  source!: Signal<Record<string,DatasourceInputType>>;

  portfolioId = input<string>();

  portfolio = computed(() => {
    const id = this.portfolioId();
    if (!id) return undefined;
    return this.portfolioService.portfolios()[id]
  })

  datasource = computed(() => {
    const portfolio = this.portfolio();
    if (!portfolio) return [];
    return this.convertPortfolio(portfolio)
  });

  total = computed(() => {
    const portfolio = this.portfolio();
    if (!portfolio) return null;

    return this.quoteService.enhanceExchangeInfo(
      portfolio.total as SummarizedDataType, portfolio.currency as Currency, 
      ["marketValue", "profit"])
  });

  portfolioName = computed(() => {
    return this.portfolio()?.name || '';
  });

  convertPortfolio(portfolio: PortfolioType) {
    return Object.values(portfolio.allocations || {})
      .map(allocation=> this.convertAllocation(allocation))
    ;
  }

  private convertAllocation(allocation: PortfolioAllocationType)  {
    return {
      ...allocation,
      ...this.quoteService.enhanceExchangeInfo(allocation, allocation.quote.currency, ["initialValue", "marketValue", "profit", "averagePrice"]),
      quote: this.quoteService.enhanceExchangeInfo(allocation.quote, allocation.quote.currency, ["value"]).value
    };
  }

  selectRow(row: ReturnType<InvestmentPortfolioTableComponent["convertAllocation"]>) {
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

          const portfolio = this.portfolio();
          if (!! portfolio?.id) {
            this.portfolioService.updatePortfolio(portfolio.id, changes)
          }
        }
      }
    });
  }

}
