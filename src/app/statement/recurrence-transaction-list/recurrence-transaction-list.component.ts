import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { RecurrenceStatemetType } from '../../model/source.model';
import { SourceService } from '../../service/source.service';
import { StatementService } from '../../service/statement.service';
import { RecurrencePipe } from '../../utils/pipe/recurrence.pipe';
import { StatementTypePipe } from '../../utils/pipe/statement-type.pipe';
import { BalanceService } from '../../service/balance.service';

@Component({
  selector: 'app-recurrence-transaction-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    DatePipe,
    CurrencyPipe,
    StatementTypePipe,
    RecurrencePipe
  ],
  templateUrl: './recurrence-transaction-list.component.html',
  styleUrl: './recurrence-transaction-list.component.scss'
})
export class RecurrenceTransactionListComponent {

  private sourceService = inject(SourceService);
  
  private statementService = inject(StatementService);

  private balanceService = inject(BalanceService);

  // Computa os dados do serviço
  readonly dataSource = computed(() => Object.values(this.sourceService.recurrenceSource()));

  // Define as colunas exibidas na tabela
  readonly displayedColumn = [
    'description',
    'type',
    'value',
    'originAccountId',
    'category',
    'recurrenceType',
    'startDate',
    'actions'
  ];

  private filters = signal<{ type: string; category: string; recurrenceType: string }>({
    type: '',
    category: '',
    recurrenceType: ''
  });

  readonly recurrencePipe = new RecurrencePipe();

  readonly statementTypePipe = new StatementTypePipe();

  readonly activeRow = signal<RecurrenceStatemetType | null>(null);

  readonly accounts = this.balanceService.getAllBalances();

  readonly filteredDataSource = computed(() => {
    const { type, category, recurrenceType } = this.filters();
    return this.dataSource().filter(item =>
      (!type || this.statementTypePipe.transform(item.type).toLowerCase().includes(type.toLowerCase())) &&
      (!category || (item.category?.toLowerCase().includes(category.toLowerCase()) || false)) &&
      (!recurrenceType || this.recurrencePipe.transform(item.recurrence.type).toLowerCase().includes(recurrenceType.toLowerCase()))
    );
  });

  // Aplica o filtro
  applyFilter(field: 'type' | 'category' | 'recurrenceType', event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filters.set({ ...this.filters(), [field]: input.value });
  }

  toogleActive(row: RecurrenceStatemetType) {
    this.activeRow.update(item => item !== row ? row : null);
  }

  newRecurrence() {
    this.statementService.newRecurrenceStatement();
  }

  editRecurrence(transaction: RecurrenceStatemetType) {
    this.statementService.editRecurrenceStatement(transaction);
  }

  deleteRecurrence(transaction: RecurrenceStatemetType) {
    this.statementService.deleteRecurrenceStatement(transaction.id as string);
  }
}
