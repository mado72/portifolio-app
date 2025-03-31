import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { TransactionEnum, TransactionStatus } from '../../model/investment.model';
import { TransactionService } from '../../service/transaction.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionStatusPipe } from '../transaction-status.pipe';
import { TransactionTypePipe } from '../transaction-type.pipe';
import { TransactionType } from '../../model/source.model';


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
    this.transactionService.openDialog({
      newTransaction: true,
      title: 'Adicionar Transação',
      transaction: {
        id: '',
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
    this.transactionService.openDialog({
      newTransaction: false,
      title: 'Editar Transação',
      transaction,
      portfolios: []
    })
  }

}
