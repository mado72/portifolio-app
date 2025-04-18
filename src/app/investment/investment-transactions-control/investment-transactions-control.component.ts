import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { InvestmentTransactionType } from '../../model/source.model';
import { TransactionService } from '../../service/transaction.service';
import { IntestmentTransactionFormData, InvestmentTransactionFormComponent, InvestmentTransactionFormResult } from '../investment-transaction-form/investment-transaction-form.component';
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
export class InvestmentTransactionsControlComponent implements OnInit {

  private activatedRoute = inject(ActivatedRoute);

  private transactionService = inject(TransactionService);

  formData = signal<IntestmentTransactionFormData>(null);

  ngOnInit(): void {
    const action = this.activatedRoute.snapshot.data["action"];
    switch (action) {
      case 'create':
        this.formData.set({
          allocations: this.transactionService.createTransactionAllocations()
        });
        break;
      case 'edit':
        const transactionId = this.activatedRoute.snapshot.paramMap.get("id");
        if (transactionId) {
          const transaction = this.transactionService.investmentTransactions()
            .find(transaction => transaction.id === transactionId);

          if (!transaction) {
            this.formData.set(null);
            return;
          }
          
          const [marketPlace, code] = transaction?.ticker.split(':') || [undefined, undefined];
          this.formData.set({
            ...transaction,
            marketPlace,
            code,
            allocations: this.transactionService.allocationByTransactions()[transactionId]?.map(allocation=>({
              id: allocation.portfolioId,
              name: allocation.portfolioName,
              qty: allocation.quantity
            })) || [],
          });
        }
        break;
      default:
    }
  }

  addTransaction() {
    this.transactionService.createTransaction();
  }

  editTransaction(transaction: InvestmentTransactionType) {
    this.transactionService.editTransaction(transaction.id);
  }

  onDeleteItem(transactionId: string) {
    this.transactionService.deleteTransaction(transactionId);
  }

  onSaveTransaction(transaction: InvestmentTransactionFormResult) {
    this.formData.set(null);
    this.transactionService.saveTransaction(transaction).subscribe(()=>{
      this.transactionService.listTransactions();
    });
  }

  onCancelTransactionForm() {
    this.transactionService.listTransactions();
  }
}
