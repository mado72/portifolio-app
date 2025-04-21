import { computed, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TransactionDialogComponent, TransactionDialogType } from '../investment/transaction-dialog/transaction-dialog.component';
import { InvestmentEnum, TransactionStatus } from '../model/investment.model';
import { InvestmentTransactionType, PortfolioType } from '../model/source.model';
import { AssetService } from './asset.service';
import { PortfolioChangeType, PortfolioService } from './portfolio-service';
import { QuoteService } from './quote.service';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private router = inject(Router);

  private portfolioService = inject(PortfolioService);

  private assetService = inject(AssetService);

  private sourceService = inject(SourceService);

  private quoteService = inject(QuoteService);

  private dialog = inject(MatDialog);

  investmentTransactions = computed(() => {
    return this.sourceService.investmentSource();
  })

  readonly allocationByTransactions = computed(() => {
    return this.portfolioService.portfolioAllocation().reduce((acc, portfolio) => {
      Object.values(portfolio.allocations).forEach(({ data }) => {
        data.transactions.forEach(({id, quantity}) => {
          if (!acc[id]) {
            acc[id] = [];
          }
          acc[id].push({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            quantity
          });
        })
      });
      return acc;
    }, {} as { [transactionId: string]: { portfolioId: string, portfolioName: string, quantity: number }[] });
  })

  constructor() { }

  createTransactionAllocations() {
    return Object.values(this.portfolioService.portfolios()).map(portfolio => {
      return {
        id: portfolio.id,
        name: portfolio.name,
        qty: 0
      }
    })
  }

  saveTransaction(transaction: InvestmentTransactionType, allocations?: { [id: string]: number }) {
    return new Observable<InvestmentTransactionType>(subscriber => {
      const ticker = transaction.ticker;
      let asset = this.assetService.assets()[ticker];
      if (!asset) {
        this.assetService.newDialog(ticker).subscribe(() => {
          asset = this.assetService.assets()[ticker];
          if (!asset) {
            subscriber.error(new Error('Asset not found'));
            subscriber.complete();
            return;
          }
          transaction.value.currency = asset.quote.currency;
          this.persistTransaction(transaction, allocations);
          this.quoteService.addPendding(transaction.ticker);
          subscriber.next(transaction);
          subscriber.complete();
        })
      }
      else {
        this.quoteService.addPendding(transaction.ticker);
        this.persistTransaction(transaction, allocations);
        subscriber.next(transaction);
        subscriber.complete();
      }
    })
  }

  protected persistTransaction(transaction: InvestmentTransactionType, allocations?: { [id: string]: number }) {
    if (!!transaction.id) {
      this.sourceService.updateInvestmentTransaction([transaction]);
    }
    else {
      transaction = this.sourceService.addInvestmentTransaction(transaction);
    }
    if (allocations) {
      this.portfolioService.processAllocations(transaction.ticker, transaction.id, transaction.quote, allocations);
    }
  }

  deleteTransaction(id: string) {
    this.sourceService.deleteInvestmentTransaction(id);
  }

  openDialog(data: TransactionDialogType) {
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      data
    })

    dialogRef.afterClosed().subscribe((result: TransactionDialogType) => {
      if (result) {
        this.saveTransaction({
          ...data.transaction, ...result.transaction
        });
        // Get portfolios allocations for the current transaction's ticker
        const portfolios = this.portfolioService.getAllPortfolios();

        // Update portfolio allocations if necessary
        const allocations = result.portfolios.reduce((alloc, item) => {

          // Get the portfolio referenced by the current transaction's portfolio id
          const portfolio = portfolios.find(portfolio => portfolio.id === item.id);
          if (!portfolio) return alloc;

          // Check if portfolio already has an allocation for the current transaction's ticker
          const previousQuantity = portfolio.allocations[result.transaction.ticker]?.quantity || 0;

          // Avoid unnecessary allocation adjustment if quantity doesn't change
          if ((previousQuantity >= item.quantity && result.transaction.type === InvestmentEnum.BUY)
            || (previousQuantity <= item.quantity && result.transaction.type === InvestmentEnum.SELL)
          ) return alloc;

          // Adjust portfolio allocations
          // alloc[item.id] = { // FIXME: Corrigir aqui
          //   ...(alloc[item.id] || item),
          //   transactionId: result.transaction.id,
          //   allocations: [...(alloc[item.id]?.transaction || []), {
          //     ticker: result.transaction.ticker,
          //     percPlanned: 0,
          //     quantity: item.quantity * (result.transaction.type === InvestmentEnum.BUY ? 1 : -1)
          //   }]
          // };

          return alloc;
        }, {} as Record<string, PortfolioChangeType & { id: string }>);

        Object.entries(allocations).forEach(([portfolioId, changes]) => {
          this.portfolioService.updatePortfolio(portfolioId, changes);
        });
      }
    });
  }

  createTransaction() {
    this.router.navigate(['investment', 'transactions', 'create']);
  }

  editTransaction(transactionId: string) {
    this.router.navigate(['investment', 'transactions', 'edit', transactionId]);
  }

  listTransactions() {
    this.router.navigate(['investment', 'transactions']);
  }

  openAddDialog() {
    this.openDialog({
      newTransaction: true,
      title: 'Adicionar Transação',
      transaction: {
        id: '',
        ticker: '',
        date: new Date(),
        accountId: '',
        quantity: 0,
        quote: NaN,
        value: { value: 0, currency: this.sourceService.currencyDefault() },
        type: InvestmentEnum.BUY,
        status: TransactionStatus.COMPLETED
      },
      portfolios: []
    });
  }

  computeAllocationsOfTransaction(portfolios: PortfolioType[], quantity: number, transactionId?: string): Record<string, { id: string; name: string; qty: number; allocated: number; }> {
    return portfolios.map(portfolio => ({
        id: portfolio.id,
        name: portfolio.name,
        allocated: Object.values(portfolio.allocations)
          .map(allocation => allocation.quantity)
          .reduce((tot, vl) => tot += vl, 0),
        qty: quantity
      }))
      .reduce((acc, portfolio) => {
        acc[portfolio.id] = portfolio;
        return acc;
      }, {} as Record<string, { id: string; name: string; qty: number; allocated: number; }>);
  }

}
