import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { Currency } from '../../model/domain.model';
import { TransactionEnum, TransactionStatus, TransactionType } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { TransactionService } from '../../service/transaction.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionDialogComponent, TransactionDialogType } from '../transaction-dialog/transaction-dialog.component';
import { TransactionStatusPipe } from '../transaction-status.pipe';
import { TransactionTypePipe } from '../transaction-type.pipe';

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

  private investmentService = inject(InvestmentService);

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

  getPortfolios(ticker?: string) {
    return this.investmentService.getPortfolioAssetsSummary().pipe(
      map(summaries=>{
        return summaries.map(summary => (
          {
            portfolio: {...summary},
            quantity: summary.assets.filter(item=>item.ticker === ticker).reduce((acc, vl) => acc + (vl?.quantity || 0), 0)
          }));
      })
    )
  }

  addTransaction() {
    this.getPortfolios().subscribe(portfolios => {
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
        portfolios: portfolios.map(item => ({id: item.portfolio.id, name: item.portfolio.name, quantity: item.quantity}))
      })
    });
  }

  deleteTransaction(event: MouseEvent, transaction: TransactionType) {
    event.stopPropagation();
    this.transactionService.deleteTransaction(transaction.id as string).subscribe(_=>{
      this.changeDetectorRef.detectChanges(); // Refresh table data
    });
  }

  editTransaction(transaction: TransactionType) {
    this.getPortfolios(transaction.ticker).subscribe(portfolios => {
      this.openDialog({
        newTransaction: false,
        title: 'Editar Transação',
        transaction,
        portfolios: portfolios.map(item => ({id: item.portfolio.id, name: item.portfolio.name, quantity: item.quantity}))
      })
    });
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
          const portfolioUpdates = result.portfolios.map(item=> ({
            ...item,
            ticker: result.transaction.ticker,
            quote: result.transaction.quote,
            transaction: result.transaction,
            date: new Date()
          }));

          this.investmentService.updatePortfolioAssets({ portfolioUpdates }).subscribe(_ => {
            this.changeDetectorRef.detectChanges(); // Refresh table data
          });
          
        });
      }
    });
  }

}
