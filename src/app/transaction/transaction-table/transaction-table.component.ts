import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { TransactionType } from '../../model/investment.model';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TransactionTypePipe } from '../transaction-type.pipe';
import { TransactionStatusPipe } from '../transaction-status.pipe';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../service/transaction.service';
import { MatButtonModule } from '@angular/material/button';

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
addTransaction() {
throw new Error('Method not implemented.');
}

  private transactionService = inject(TransactionService); // Assuming this is a service that provides transaction data

  readonly displayedColumns = ["ticket", "date", "type", "quote", "value", "status", "account", "brokerage", "actions"];

  dataSource = this.transactionService.getTransactions();

  getAccount(accountId: string) {
    // Simulate fetching account details
    return `Account ${accountId}`;
  }

  deleteTransaction(_t133: any) {
    throw new Error('Method not implemented.');
  }

  editTransaction(_t133: any) {
    throw new Error('Method not implemented.');
  }

}
