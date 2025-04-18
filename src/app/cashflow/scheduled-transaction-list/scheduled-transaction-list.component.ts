import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ScheduledStatemetType } from '../../model/source.model';
import { BalanceService } from '../../service/balance.service';
import { SourceService } from '../../service/source.service';
import { CashflowService } from '../../service/cashflow.service';
import { CashflowTypePipe } from '../../utils/pipe/cashflow-type.pipe';
import { ScheduledPipe } from '../../utils/pipe/scheduled.pipe';

@Component({
  selector: 'app-scheduled-transaction-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    DatePipe,
    CurrencyPipe,
    CashflowTypePipe,
    ScheduledPipe
  ],
  templateUrl: './scheduled-transaction-list.component.html',
  styleUrl: './scheduled-transaction-list.component.scss'
})
export class ScheduledTransactionListComponent {

  private sourceService = inject(SourceService);
  
  private transactionService = inject(CashflowService);

  private balanceService = inject(BalanceService);

  // Computa os dados do serviço
  readonly dataSource = computed(() => Object.values(this.sourceService.scheduledSource()));

  // Define as colunas exibidas na tabela
  readonly displayedColumn = [
    'description',
    'type',
    'value',
    'originAccountId',
    'targetAccountId',
    'category',
    'scheduledType',
    'startDate',
    'actions'
  ];

  private filters = signal<{ type: string; category: string; scheduledType: string }>({
    type: '',
    category: '',
    scheduledType: ''
  });

  readonly scheduledPipe = new ScheduledPipe();

  readonly cashflowTypePipe = new CashflowTypePipe();

  readonly activeRow = signal<ScheduledStatemetType | null>(null);

  readonly accounts = this.balanceService.getAllBalances();

  readonly filteredDataSource = computed(() => {
    const { type, category, scheduledType } = this.filters();
    return this.dataSource().filter(item =>
      (!type || this.cashflowTypePipe.transform(item.type).toLowerCase().includes(type.toLowerCase())) &&
      (!category || (item.category?.toLowerCase().includes(category.toLowerCase()) || false)) &&
      (!scheduledType || this.scheduledPipe.transform(item.scheduled.type).toLowerCase().includes(scheduledType.toLowerCase()))
    );
  });

  // Aplica o filtro
  applyFilter(field: 'type' | 'category' | 'scheduledType', event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filters.set({ ...this.filters(), [field]: input.value });
  }

  toogleActive(row: ScheduledStatemetType) {
    this.activeRow.update(item => item !== row ? row : null);
  }

  newScheduled() {
    this.transactionService.newScheduledStatement();
  }

  editScheduled(transaction: ScheduledStatemetType) {
    this.transactionService.editScheduledStatement(transaction);
  }

  deleteScheduled(transaction: ScheduledStatemetType) {
    this.transactionService.deleteScheduledStatement(transaction.id as string);
  }
}
