import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { InvestmentTransactionType } from '../../model/source.model';
import { TransactionService } from '../../service/transaction.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionStatusPipe } from '../../utils/pipe/transaction-status.pipe';
import { BalanceService } from '../../service/balance.service';
import { TransactionTypePipe } from '../../utils/pipe/transaction-type.pipe';
import { InvestmentTransactionFormComponent } from '../investment-transaction-form/investment-transaction-form.component';


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
    InvestmentTransactionFormComponent
  ],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.scss'
})
export class TransactionTableComponent {

  private transactionService = inject(TransactionService);

  private balanceService = inject(BalanceService);

  private changeDetectorRef = inject(ChangeDetectorRef);

  readonly displayedColumns = ["ticker", "date", "type", "quantity", "quote", "value", "status", "account", "brokerage", "actions"];

  dataSource = computed(() => {
    return this.transactionService.investmentTransactions();
  });

  readonly accounts = computed(() => this.balanceService.getAllBalances())

  addTransaction() {
    this.transactionService.openAddDialog()
  }

  deleteTransaction(event: MouseEvent, transaction: InvestmentTransactionType) {
    event.stopPropagation();
    this.transactionService.deleteTransaction(transaction.id as string);
    this.changeDetectorRef.detectChanges(); // Refresh table data
  }

  editTransaction(transaction: InvestmentTransactionType) {
    this.transactionService.openDialog({
      newTransaction: false,
      title: 'Editar Transação',
      transaction,
      portfolios: []
    })
  }

}
