import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, input, Signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { InvestmentTransactionType, PortfolioAllocation, SummarizedDataType, TrendType } from '../../model/source.model';
import { AssetService } from '../../service/asset.service';
import { ExchangeService } from '../../service/exchange.service';
import { PortfolioService } from '../../service/portfolio-service';
import { TransactionService } from '../../service/transaction.service';
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
    ExchangeComponent
],
  templateUrl: './investment-portfolio-table.component.html',
  styleUrl: './investment-portfolio-table.component.scss'
})
export class InvestmentPortfolioTableComponent {

  private exchangeService = inject(ExchangeService);

  private portfolioService = inject(PortfolioService);

  private transactionService = inject(TransactionService);

  private assetService = inject(AssetService);

  private dialog = inject(MatDialog);

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'quantity', 'averagePrice', 'marketValue', 'profit', 'percPlanned', 'percAllocation'];

  exchangeView = computed(() => this.exchangeService.exchangeView());

  editable = input<boolean>(false);

  currency = input<Currency>(this.exchangeService.currencyDefault());

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

    return Object.values(portfolio.allocations || {})
      .map(allocation=> this.convertAllocation(allocation))
      .sort((a, b) => a.name.localeCompare(b.name))
  });

  total = computed(() => {
    const portfolio = this.portfolio();
    if (!portfolio) return null;

    return this.exchangeService.enhanceExchangeInfo(
      portfolio.total as SummarizedDataType, portfolio.currency as Currency, 
      ["marketValue", "profit"])
  });

  portfolioName = computed(() => {
    return this.portfolio()?.name || '';
  });

  private convertAllocation(allocation: PortfolioAllocation)  {
    const asset = this.assetService.assets()[allocation.data.ticker];
    const quantity = allocation.data.transactions.reduce((acc, t)=> acc += t.quantity, 0);
    return {
      ...allocation.data,
      ...this.exchangeService.enhanceExchangeInfo(allocation.data, asset.quote.currency, ["initialValue", "marketValue", "profit"]),
      quantity,
      name: asset.name,
      type: asset.type,
      trend: asset.trend,
      quote: this.exchangeService.enhanceExchangeInfo(asset.quote, asset.quote.currency, ["value"]).value,
      averagePrice: this.exchangeService.enhanceExchangeInfo({value: allocation.data.initialValue / quantity}, asset.quote.currency, ["value"]).value,
    };
  }

  selectRow(row: ReturnType<InvestmentPortfolioTableComponent["convertAllocation"]>) {
    const asset = this.assetService.assets()[row.ticker];

    const investmentTransactions = this.transactionService.investmentTransactions();
    const transactions = row.transactions.map(({id})=>investmentTransactions[id]);

    const data: PorfolioAllocationDataType & { transactions: InvestmentTransactionType[]} = {
      ticker: row.ticker,
      asset,
      portfolio: this.portfolioName(),
      percent: row.percPlanned,
      currency: asset.quote.currency,
      manualQuote: asset.manualQuote === true,
      marketValue: row.marketValue?.original.value || 0,
      transactions
    }
    const dialogRef = this.dialog.open(PortfolioAllocationDialogComponent, { data });

    dialogRef.afterClosed().subscribe((result: PorfolioAllocationDataType & {remove?: boolean}) => {
      if (result) {
        const portfolio = this.portfolio();

        if (!! portfolio?.id) {
          if (result.remove) {
            // Remove asset transactions of portfolio
            portfolio.allocations[data.ticker].data.transactions = [];
            this.portfolioService.updatePortfolio(portfolio.id, portfolio);
          }
          else {
            portfolio.allocations[data.ticker].data.percPlanned = result.percent;
            this.portfolioService.updatePortfolio(portfolio.id, {...portfolio});
          }
        }
      }
    });
  }

}
