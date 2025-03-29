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

  getPortfoliosAssetsSummary(ticker?: string) {
    return this.portfolioService.getAllPortfolios().map(portfolio=>({
      portfolio: {...portfolio},
      quantity: Object.values(portfolio.allocations())
        .filter(item=>!ticker || ticker === getMarketPlaceCode(item))
        .reduce((acc, vl) => acc + (vl?.quantity || 0), 0)
    }))
  }

  addTransaction() {
    const summaries = this.getPortfoliosAssetsSummary();
    this.openDialog({
      newTransaction: true,
      title: 'Adicionar Transação',
      transaction: {
        ticker: '',
        date: new Date(),
        accountId: '',
        quantity: 1,
        quote: 1,
        value: { amount: 0, currency: Currency.BRL },
        type: TransactionEnum.BUY,
        status: TransactionStatus.COMPLETED
      },
      portfolios: summaries.map(item => ({id: item.portfolio.id, name: item.portfolio.name, quantity: item.quantity}))
    })
  }

  deleteTransaction(event: MouseEvent, transaction: TransactionType) {
    event.stopPropagation();
    this.transactionService.deleteTransaction(transaction.id as string).subscribe(_=>{
      this.changeDetectorRef.detectChanges(); // Refresh table data
    });
  }

  editTransaction(transaction: TransactionType) {
    const summaries = this.getPortfoliosAssetsSummary();
    this.openDialog({
      newTransaction: false,
      title: 'Editar Transação',
      transaction,
      portfolios: summaries.map(item => ({id: item.portfolio.id, name: item.portfolio.name, quantity: item.quantity}))
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
          const allocations = result.portfolios.reduce((alloc, item) => {
            alloc[item.id] = {
              ...(alloc[item.id] || item),
              allocations: [...(alloc[item.id].allocations || []), {
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
