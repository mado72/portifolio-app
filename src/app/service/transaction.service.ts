import { computed, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TransactionEnum, TransactionStatus } from '../model/investment.model';
import { InvestmentTransactionType } from '../model/source.model';
import { TransactionDialogComponent, TransactionDialogType } from '../transaction/transaction-dialog/transaction-dialog.component';
import { PortfolioChangeType, PortfolioService } from './portfolio-service';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private portfolioService = inject(PortfolioService);

  private sourceService = inject(SourceService);

  private dialog = inject(MatDialog);

  transactionSignal = computed(() => {
    return Object.values(this.sourceService.transactionSource());
  })

  constructor() {}

  saveTransaction(result: InvestmentTransactionType) {
    if (!! result.id) {
      this.sourceService.updateTransaction([result]);
    }
    else {
      this.sourceService.addTransaction(result);
    }
  }

  deleteTransaction(id: string) {
    this.sourceService.deleteTransaction(id);
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
          if ((previousQuantity >= item.quantity && result.transaction.type === TransactionEnum.BUY)
            || (previousQuantity <= item.quantity && result.transaction.type === TransactionEnum.SELL)
          ) return alloc;

          // Adjust portfolio allocations
          alloc[item.id] = {
            ...(alloc[item.id] || item),
            allocations: [...(alloc[item.id]?.allocations || []), {
              ticker: result.transaction.ticker,
              percPlanned: 0,
              quantity: item.quantity * (result.transaction.type === TransactionEnum.BUY? 1 : -1)
            }]
          };

          return alloc;
        }, {} as Record<string, PortfolioChangeType & {id: string}>);

        Object.entries(allocations).forEach(([portfolioId, changes])=> {
          this.portfolioService.updatePortfolio(portfolioId, changes);
        });
      }
    });
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
            value: { price: 0, currency: this.sourceService.currencyDefault() },
            type: TransactionEnum.BUY,
            status: TransactionStatus.COMPLETED
          },
          portfolios: []
        });
  }
}
