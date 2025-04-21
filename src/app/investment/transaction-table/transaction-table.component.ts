import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { InvestmentTransactionType } from '../../model/source.model';
import { BalanceService } from '../../service/balance.service';
import { TransactionService } from '../../service/transaction.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { InvestmentTypePipe } from '../../utils/pipe/investment-type.pipe';
import { TransactionStatusPipe } from '../../utils/pipe/transaction-status.pipe';


@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    InvestmentTypePipe,
    TransactionStatusPipe,
    CurrencyComponent
  ],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.scss'
})
export class TransactionTableComponent {

  private transactionService = inject(TransactionService);

  private balanceService = inject(BalanceService);

  private changeDetectorRef = inject(ChangeDetectorRef);

  readonly displayedColumns = ["ticker", "date", "type", "quantity", "quote", "value", "status", "account", "fees", "actions"];

  @Output() onDeleteItem = new EventEmitter<string>();

  @Output() onClickItem = new EventEmitter<InvestmentTransactionType>();

  dataSource = computed(() => {
    return Object.values(this.transactionService.investmentTransactions()).sort((t1,t2)=>t2.date.getTime()-t1.date.getTime());
  });

  readonly accounts = computed(() => this.balanceService.getAllBalances())

  deleteTransaction(event: MouseEvent, transaction: InvestmentTransactionType) {
    event.stopPropagation();
    this.onDeleteItem.emit(transaction.id);
    this.changeDetectorRef.detectChanges(); // Refresh table data
  }

  editTransaction(transaction: InvestmentTransactionType) {
    this.onClickItem.emit(transaction);
  }

}
