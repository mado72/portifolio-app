import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { InvestmentTransactionType } from '../model/source.model';
import { AssetService } from './asset.service';
import { PortfolioService } from './portfolio-service';
import { SourceService } from './source.service';
import { InvestmentEnum, TransactionStatus } from '../model/investment.model';
import { isWithinInterval } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private router = inject(Router);

  private portfolioService = inject(PortfolioService);

  private assetService = inject(AssetService);

  private sourceService = inject(SourceService);

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
        this.assetService.newDialog(ticker).subscribe((raw) => {
          if (!raw) {
            subscriber.error(new Error('Asset not found'));
            subscriber.complete();
            return;
          }

          asset = this.assetService.assets()[raw.ticker];
          if (!asset) {
            subscriber.error(new Error('Asset not found'));
            subscriber.complete();
            return;
          }
          transaction.ticker = asset.ticker;
          transaction.value.currency = asset.quote.currency;
          transaction.status = TransactionStatus.COMPLETED;
          this.persistTransaction(transaction, allocations);
          subscriber.next(transaction);
          subscriber.complete();
        })
      }
      else {
        transaction.status = TransactionStatus.COMPLETED;
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

  mapByAssetIncome(interval: { start: Date, end: Date}): { [ticker: string]: InvestmentTransactionType[] } {
    const types = [InvestmentEnum.DIVIDENDS, InvestmentEnum.IOE_RETURN, InvestmentEnum.RENT_RETURN];
    return Object.values(this.investmentTransactions()).filter(transaction => {
      return types.includes(transaction.type) && isWithinInterval(transaction.date, interval);
    })
    .sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    })
    .reduce((acc, transaction) => {
      if (!acc[transaction.ticker]) {
        acc[transaction.ticker] = [];
      }
      acc[transaction.ticker].push(transaction);
      return acc;
    }, {} as { [ticker: string]: InvestmentTransactionType[] });
  }

  mapByAsset(interval: { start: Date, end: Date}): { [ticker: string]: InvestmentTransactionType[] } {
    return Object.values(this.investmentTransactions()).filter(transaction => {
      return isWithinInterval(transaction.date, interval);
    }).reduce((acc, transaction) => {
      if (!acc[transaction.ticker]) {
        acc[transaction.ticker] = [];
      }
      acc[transaction.ticker].push(transaction);
      return acc;
    }, {} as { [ticker: string]: InvestmentTransactionType[] });
  }
}
