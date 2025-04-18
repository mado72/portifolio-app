import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InvestmentTransactionType } from '../../model/source.model';
import { TransactionService } from '../../service/transaction.service';
import { IntestmentTransactionFormData, InvestmentTransactionFormComponent, InvestmentTransactionFormResult } from '../investment-transaction-form/investment-transaction-form.component';
import { TransactionTableComponent } from '../transaction-table/transaction-table.component';
import { PortfolioService } from '../../service/portfolio-service';
import { SourceService } from '../../service/source.service';
import { AssetService } from '../../service/asset.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionStatus } from '../../model/investment.model';
import { QuoteService } from '../../service/quote.service';

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

  private router = inject(Router);

  private activatedRoute = inject(ActivatedRoute);

  private sourceService = inject(SourceService);

  private assetService = inject(AssetService);

  private transactionService = inject(TransactionService);

  private portfolioService = inject(PortfolioService);

  private quoteService = inject(QuoteService);

  formData = signal<IntestmentTransactionFormData>(null);

  ngOnInit(): void {
    const action = this.activatedRoute.snapshot.data["action"];
    switch (action) {
      case 'create':
        this.formData.set({
          allocations: Object.values(this.sourceService.portfolioSource()).map(allocation => {
            return {
              id: allocation.id,
              name: allocation.name,
              qty: 0
            }
          })
        });
        break;
      case 'edit':
        const transactionId = this.activatedRoute.snapshot.paramMap.get("id");
        if (transactionId) {
          const transaction = this.transactionService.investmentTransactions()
            .find(transaction => transaction.id === transactionId);
          const [marketPlace, code] = transaction?.ticker.split(':') || ['',''];
          this.formData.set({
            ...transaction,
            marketPlace,
            code,
            allocations: transaction?.allocations
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
    let asset = this.sourceService.assetSource()[transaction.ticker];
    if (!asset) {
      this.assetService.newDialog(transaction.ticker).subscribe(() => {
        asset = this.sourceService.assetSource()[transaction.ticker];
        transaction.value.currency = asset.quote.currency;
        this.saveTransaction(transaction);
      })
    }
    else {
      this.saveTransaction(transaction);
    }
  }

  saveTransaction(transaction: InvestmentTransactionFormResult) {

    const allocations = transaction.allocations.reduce((acc, vl) => {
      acc[vl.id] = vl.qty;
      return acc;
    }, {} as { [id: string]: number })

    const t = { ...transaction } as InvestmentTransactionType;
    delete t.allocations;

    t.status = TransactionStatus.COMPLETED;
    this.transactionService.saveTransaction(t);
    this.portfolioService.processAllocations(t.ticker, transaction.quote, allocations);
    this.quoteService.addPendding(t.ticker);
    this.transactionService.listTransactions();
  }

  onCancelTransactionForm() {
    this.transactionService.listTransactions();
  }
}
