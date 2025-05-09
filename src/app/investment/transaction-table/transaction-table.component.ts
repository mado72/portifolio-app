import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, EventEmitter, inject, Output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { InvestmentTransactionType } from '../../model/source.model';
import { BalanceService } from '../../service/balance.service';
import { ExchangeService } from '../../service/exchange.service';
import { TransactionService } from '../../service/transaction.service';
import { ExchangeComponent } from '../../utils/component/exchange/exchange.component';
import { InvestmentTypePipe } from '../../utils/pipe/investment-type.pipe';
import { TransactionStatusPipe } from '../../utils/pipe/transaction-status.pipe';
import { FilterType, TransactionTableFilterComponent } from '../transaction-table-filter/transaction-table-filter.component';


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
    TransactionTableFilterComponent,
    ExchangeComponent
  ],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.scss'
})
export class TransactionTableComponent {

  private activatedRoute = inject(ActivatedRoute);

  private transactionService = inject(TransactionService);

  private balanceService = inject(BalanceService);

  private changeDetectorRef = inject(ChangeDetectorRef);

  private exchangeService = inject(ExchangeService);

  readonly displayedColumns = ["ticker", "date", "type", "quantity", "quote", "value", "status", "account", "fees", "actions"];

  @Output() onDeleteItem = new EventEmitter<string>();

  @Output() onClickItem = new EventEmitter<InvestmentTransactionType>();

  filter = signal<FilterType>({
    investmentType: null,
    marketPlace: null,
    ticker: null,
    start: null,
    end: null,
    accountId: null
  })

  dataSource = computed(() => {
    const filter = this.filter();
    return Object.values(this.transactionService.investmentTransactions())
      .filter(t => {
        if (filter.investmentType && t.type !== filter.investmentType) return false;
        if (filter.marketPlace && !t.ticker.startsWith(filter.marketPlace)) return false;
        if (filter.ticker && !t.ticker.toLocaleUpperCase().includes(filter.ticker.toLocaleUpperCase())) return false; // Filtro por ticker
        if (filter.start && t.date < filter.start) return false;
        if (filter.end && t.date > filter.end) return false;
        if (filter.accountId && t.accountId !== filter.accountId) return false;
        return true;
      })
      .map(t => ({
        ...t,
        ...this.exchangeService.enhanceExchangeInfo(t.value, t.value.currency, ['value'])
      }))
      .sort((t1, t2) => t2.date.getTime() - t1.date.getTime());
  });

  readonly accounts = computed(() => this.balanceService.getAllBalances())

  constructor() {
    this.activatedRoute.queryParams.subscribe((params) => {
      const investmentType = params['investmentType'] ?? null;
      const marketPlace = params['marketPlace'] ?? null;
      const ticker = params['ticker'] ?? null; // Captura o ticker da URL
      const start = params['start'] ? new Date(params['start']) : null;
      const end = params['end'] ? new Date(params['end']) : null;
      const accountId = params['account'] ?? null;
      this.filter.set({
        investmentType,
        marketPlace,
        ticker, // Adicionado ao filtro
        start,
        end,
        accountId
      });
    });
  }

  deleteTransaction(event: MouseEvent, transaction: InvestmentTransactionType) {
    event.stopPropagation();
    this.onDeleteItem.emit(transaction.id);
    this.changeDetectorRef.detectChanges(); // Refresh table data
  }

  editTransaction(transaction: InvestmentTransactionType) {
    this.onClickItem.emit(transaction);
  }

}
