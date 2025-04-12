import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InvestmentTransactionType } from '../../model/source.model';
import { TransactionService } from '../../service/transaction.service';
import { InvestmentTransactionFormComponent, InvestmentTransactionFormResult } from '../investment-transaction-form/investment-transaction-form.component';
import { TransactionTableComponent } from '../transaction-table/transaction-table.component';

@Component({
  selector: 'app-investment-transactions-control',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    TransactionTableComponent,
    InvestmentTransactionFormComponent
  ],
  templateUrl: './investment-transactions-control.component.html',
  styleUrl: './investment-transactions-control.component.scss'
})
export class InvestmentTransactionsControlComponent {

  private transactionService = inject(TransactionService);

  showForm = signal(false);

  addTransaction() {
    this.showForm.set(true);
  }

  onDeleteItem(transactionId: string) {
    this.transactionService.deleteTransaction(transactionId);
  }

  onClickItem(transaction: InvestmentTransactionType) {
    /*
    this.transactionService.openDialog({
      newTransaction: false,
      title: 'Editar Transação',
      transaction,
      portfolios: []
    })
    */
  }

  onSaveTransaction(transaction: InvestmentTransactionFormResult) {
    this.showForm.set(false);
    const t = {... transaction} as InvestmentTransactionType;
    this.transactionService.saveTransaction(t);
  }
  
  onCancelTransactionForm() {
    this.showForm.set(false);
  }
}
