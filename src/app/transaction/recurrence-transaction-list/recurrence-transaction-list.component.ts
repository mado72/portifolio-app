import { Component, computed, inject, signal } from '@angular/core';
import { SourceService } from '../../service/source.service';
import { MatTableModule } from '@angular/material/table';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TransactionTypePipe } from '../transaction-type.pipe';
import { RecurrencePipe } from '../../utils/pipe/recurrence.pipe';
import { RecurrenceStatemetType } from '../../model/source.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StatementService } from '../../service/statement.service';
import { StatementTypePipe } from '../../utils/pipe/statement-type.pipe';

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
    TransactionTypePipe,
    RecurrencePipe
  ],
  templateUrl: './recurrence-transaction-list.component.html',
  styleUrl: './recurrence-transaction-list.component.scss'
})
export class RecurrenceTransactionListComponent {

  private sourceService = inject(SourceService);
  
  private statementService = inject(StatementService);

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
    'startDate'
  ];

  private filters = signal<{ type: string; category: string; recurrenceType: string }>({
    type: '',
    category: '',
    recurrenceType: ''
  });

  readonly recurrencePipe = new RecurrencePipe();

  readonly statementTypePipe = new StatementTypePipe();

  readonly activeRow = signal<RecurrenceStatemetType | null>(null);

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
