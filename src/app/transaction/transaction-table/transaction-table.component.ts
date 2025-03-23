import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { TransactionEnum, TransactionStatus, TransactionType } from '../../model/investment.model';
import { TransactionService } from '../../service/transaction.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionDialogComponent, TransactionDialogType } from '../transaction-dialog/transaction-dialog.component';
import { TransactionStatusPipe } from '../transaction-status.pipe';
import { TransactionTypePipe } from '../transaction-type.pipe';
import { isAfter, isBefore } from 'date-fns';

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

  private transactionService = inject(TransactionService); // Assuming this is a service that provides transaction data

  private dialog = inject(MatDialog);

  private changeDetectorRef = inject(ChangeDetectorRef);

  readonly displayedColumns = ["ticker", "date", "type", "quote", "value", "status", "account", "brokerage", "actions"];

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
        quantity: 1,
        quote: 1,
        value: { amount: 0, currency: Currency.BRL },
        type: TransactionEnum.BUY,
        status: TransactionStatus.COMPLETED
      }
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
    })
  }

  openDialog(data: TransactionDialogType) {
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      data
    })

    dialogRef.afterClosed().subscribe((result: TransactionType) => {
      if (result) {
        this.transactionService.saveTransaction({
          ...data.transaction, ...result
        }).subscribe(_ => {
          this.changeDetectorRef.detectChanges(); // Refresh table data
        });
      }
    });
  }


}
