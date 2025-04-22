import { computed, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { InvestmentTransactionType, PortfolioType } from '../model/source.model';
import { AssetService } from './asset.service';
import { ExchangeService } from './exchange.service';
import { PortfolioChangeType, PortfolioService } from './portfolio-service';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private router = inject(Router);

  private portfolioService = inject(PortfolioService);

  private assetService = inject(AssetService);

  private sourceService = inject(SourceService);

  private exchangeService = inject(ExchangeService);

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
          subscriber.next(transaction);
          subscriber.complete();
        })
      }
      else {
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

  createTransaction() {
    this.router.navigate(['investment', 'transactions', 'create']);
  }

  editTransaction(transactionId: string) {
    this.router.navigate(['investment', 'transactions', 'edit', transactionId]);
  }

  listTransactions() {
    this.router.navigate(['investment', 'transactions']);
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
