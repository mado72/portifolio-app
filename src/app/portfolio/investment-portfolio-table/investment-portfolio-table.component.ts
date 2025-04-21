import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, input, Signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { InvestmentTransactionType, PortfolioAllocation, PortfolioType, SummarizedDataType, TrendType } from '../../model/source.model';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';
import { SourceService } from '../../service/source.service';
import { ExchangeComponent } from "../../utils/component/exchange/exchange.component";
import { AssetTypePipe } from '../../utils/pipe/asset-type.pipe';
import { PorfolioAllocationDataType, PortfolioAllocationDialogComponent } from '../portfolio-allocation-dialog/portfolio-allocation-dialog.component';
import { TransactionService } from '../../service/transaction.service';

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

  private transactionService = inject(TransactionService);

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
      averagePrice: this.quoteService.enhanceExchangeInfo({value: allocation.data.initialValue / allocation.quantity}, asset.quote.currency, ["value"]).value,
    };
  }

  selectRow(row: ReturnType<InvestmentPortfolioTableComponent["convertAllocation"]>) {
    const asset = this.investmentService.assertsSignal()[row.ticker];

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

            if (data.asset.manualQuote && result.marketValue) {
              const asset = {...data.asset};
              asset.quote.value = result.marketValue / portfolio.allocations[data.ticker].quantity;

              this.quoteService.updateQuoteAsset(asset);
            }
          }
        }
      }
    });
  }

}
