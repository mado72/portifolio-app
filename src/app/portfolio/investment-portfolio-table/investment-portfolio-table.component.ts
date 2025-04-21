import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, input, Signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { PortfolioAllocation, PortfolioType, SummarizedDataType, TrendType } from '../../model/source.model';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';
import { SourceService } from '../../service/source.service';
import { ExchangeComponent } from "../../utils/component/exchange/exchange.component";
import { AssetTypePipe } from '../../utils/pipe/asset-type.pipe';
import { PorfolioAllocationDataType, PortfolioAllocationDialogComponent } from '../portfolio-allocation-dialog/portfolio-allocation-dialog.component';

class DatasourceInputType extends PortfolioAllocation {
  get ticker() {
    return this.data.ticker;
  }
  name!: string;
  trend!: TrendType;
};

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

  private convertAllocation(allocation: PortfolioAllocation)  {
    const asset = this.investmentService.assertsSignal()[allocation.data.ticker];
    return {
      ...allocation.data,
      ...this.quoteService.enhanceExchangeInfo(allocation.data, asset.quote.currency, ["initialValue", "marketValue", "profit"]),
      quantity: allocation.quantity,
      name: asset.name,
      type: asset.type,
      trend: asset.trend,
      quote: this.quoteService.enhanceExchangeInfo(asset.quote, asset.quote.currency, ["value"]).value,
      averagePrice: this.quoteService.enhanceExchangeInfo({value: allocation.data.marketValue / allocation.quantity}, asset.quote.currency, ["value"]).value,
    };
  }

  selectRow(row: ReturnType<InvestmentPortfolioTableComponent["convertAllocation"]>) {
    const asset = this.investmentService.assertsSignal()[row.ticker];

    const data: PorfolioAllocationDataType = {
      ticker: row.ticker,
      asset,
      portfolio: this.portfolioName(),
      quantity: row.quantity,
      percent: row.percPlanned,
      currency: asset.quote.currency,
      manualQuote: asset.manualQuote === true,
      marketValue: row.marketValue?.original.value || 0
    }
    const dialogRef = this.dialog.open(PortfolioAllocationDialogComponent, { data });

    dialogRef.afterClosed().subscribe((result: PorfolioAllocationDataType & {remove?: boolean}) => {
      if (result) {
        const portfolio = this.portfolio();

        if (!! portfolio?.id) {
          if (result.remove) {
            const allocation = {...portfolio.allocations[data.ticker].data, quantity: 0};
            // this.portfolioService.updatePortfolio(portfolio.id, {transaction: [allocation]}) // FIXME: Corrigir aqui.
          }
          else {
            const changes = {
              allocations: [{
                ticker: data.ticker,
                quantity: result.quantity,
                percPlanned: result.percent,
                marketValue: result.marketValue,
              }]
            }
  
            // this.portfolioService.updatePortfolio(portfolio.id, changes) // FIXME: Corrigir aqui
          }
        }
      }
    });
  }

}
