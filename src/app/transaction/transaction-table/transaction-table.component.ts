import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { map, of } from 'rxjs';
import { Currency } from '../../model/domain.model';
import { TransactionEnum, TransactionStatus, TransactionType } from '../../model/investment.model';
import { PortfolioChangeType, PortfolioService } from '../../service/portfolio-service';
import { TransactionService } from '../../service/transaction.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionDialogComponent, TransactionDialogType } from '../transaction-dialog/transaction-dialog.component';
import { TransactionStatusPipe } from '../transaction-status.pipe';
import { TransactionTypePipe } from '../transaction-type.pipe';
import { getMarketPlaceCode } from '../../service/quote.service';

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    TransactionTypePipe,
    TransactionStatusPipe,
    CurrencyComponent,
  ],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.scss'
})
export class TransactionTableComponent {

  private transactionService = inject(TransactionService);

  private portfolioService = inject(PortfolioService);

  private dialog = inject(MatDialog);

  private changeDetectorRef = inject(ChangeDetectorRef);

  readonly displayedColumns = ["ticker", "date", "type", "quantity", "quote", "value", "status", "account", "brokerage", "actions"];

  dataSource = computed(() => {
    return this.transactionService.transactionSignal();
  });


  getAccount(accountId: string) {
    // Simulate fetching account details
    return `Account ${accountId}`;
  }

  addTransaction() {
    this.openDialog({
      newTransaction: true,
      title: 'Adicionar Transação',
      transaction: {
        ticker: '',
        date: new Date(),
        accountId: '',
        quantity: 0,
        quote: NaN,
        value: { amount: 0, currency: Currency.BRL },
        type: TransactionEnum.BUY,
        status: TransactionStatus.COMPLETED
      },
      portfolios: []
    })
  }

  deleteTransaction(event: MouseEvent, transaction: TransactionType) {
    event.stopPropagation();
    this.transactionService.deleteTransaction(transaction.id as string).subscribe(_=>{
      this.changeDetectorRef.detectChanges(); // Refresh table data
    });
  }

  editTransaction(transaction: TransactionType) {
    this.openDialog({
      newTransaction: false,
      title: 'Editar Transação',
      transaction,
      portfolios: []
    })
  }

  openDialog(data: TransactionDialogType) {
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      data
    })

    dialogRef.afterClosed().subscribe((result: TransactionDialogType) => {
      if (result) {
        this.transactionService.saveTransaction({
          ...data.transaction, ...result
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
