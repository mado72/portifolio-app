import { computed, inject, Injectable, signal } from '@angular/core';
import { parseISO } from 'date-fns';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import transactionsSource from '../../data/transactions.json';
import { Currency } from '../model/domain.model';
import { TransactionEnum, TransactionStatus, TransactionType } from '../model/investment.model';
import { MatDialog } from '@angular/material/dialog';
import { PortfolioChangeType, PortfolioService } from './portfolio-service';
import { TransactionDialogComponent, TransactionDialogType } from '../transaction/transaction-dialog/transaction-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private portfolioService = inject(PortfolioService);

  private dialog = inject(MatDialog);

  transactionsData = signal({} as Record<string, TransactionType>);

  transactionSignal = computed(() => {
    const data = this.transactionsData();
    const values = Object.values(data).slice();
    return values;
  })

  constructor() {
    const data = (transactionsSource.data.slice().map(item => ({
      ...item,
      date: parseISO(item.date),
      type: TransactionEnum[item.type as keyof typeof TransactionEnum],
      status: TransactionStatus[item.status as keyof typeof TransactionStatus],
      value: {
        ...item.value,
        currency: Currency[item.value.currency as keyof typeof Currency]
      }
    } as TransactionType))
      .reduce((acc, item) => {
        acc[item.id as string] = item;
        return acc;
      }, {} as Record<string, TransactionType>));
    this.transactionsData.set(data);
  }

  getTransactionsDatasourceComputed() {
    return computed(() => {
      const data = this.transactionsData();
      const transactions = Object.values(data);
      return transactions;
    })
  }

  saveTransaction(result: TransactionType) {
    return new Observable<TransactionType>(observer => {
      const items = { ...this.transactionsData() }; // Creates a copy of the current state
      result.id = result.id || uuid(); // Generates an ID if it doesn't exist
      items[result.id] = result; // Adds or updates the transaction

      this.transactionsData.set(items); // Updates the signal with the new object

      observer.next(result);
      observer.complete();
    });
  }

  deleteTransaction(id: string) {
    return new Observable<void>(observer => {
      const items = { ...this.transactionsData() }; // Creates a copy of the current state
      delete items[id]; // Removes the transaction by ID

      this.transactionsData.set(items); // Updates the signal with the new object

      observer.next();
      observer.complete();
    });
  }


  openDialog(data: TransactionDialogType) {
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      data
    })

    dialogRef.afterClosed().subscribe((result: TransactionDialogType) => {
      if (result) {
        this.saveTransaction({
          ...data.transaction, ...result.transaction
        }).subscribe(_ => {

          // Get portfolios allocations for the current transaction's ticker
          const portfolios = this.portfolioService.getAllPortfolios();

          // Update portfolio allocations if necessary
          const allocations = result.portfolios.reduce((alloc, item) => {

            // Get the portfolio referenced by the current transaction's portfolio id
            const portfolio = portfolios.find(portfolio => portfolio.id === item.id);
            if (!portfolio) return alloc;

            // Check if portfolio already has an allocation for the current transaction's ticker
            const previousQuantity = portfolio.allocations()[result.transaction.ticker]?.quantity || 0;
            
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
          })
        });
      }
    });
  }
}
