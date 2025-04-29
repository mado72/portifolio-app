// financial-grid.component.ts
import { Component, EventEmitter, input, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CellChangeEvent, CellData, GridData, RowData } from './financial-gird.model';
import { getMonth } from 'date-fns';

@Component({
  selector: 'app-financial-grid',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './financial-grid.component.html',
  styleUrl: './financial-grid.component.scss',
})
export class FinancialGridComponent {
  gridData = input<GridData>(this.initializeDefaultData());
  currentMonthIndex = input<number>(getMonth(new Date()));
  @Output() cellChanged = new EventEmitter<CellChangeEvent>();
  
  // Meses abreviados em português
  readonly defaultMonths = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  initializeDefaultData() {
    const rows: RowData[] = [];
    
    // Cria algumas linhas de exemplo
    for (let i = 0; i < 5; i++) {
      const cells: CellData[] = [];
      
      for (let j = 0; j < 12; j++) {
        cells.push({ value: 0, disabled: false });
      }
      
      rows.push({
        label: `Item ${i + 1}`,
        cells: cells,
        disabled: false
      });
    }
    
    return {
      title: 'Planilha Financeira',
      months: this.defaultMonths,
      rows: rows
    };
  }

  onCellChange(rowIndex: number, columnIndex: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value === '' ? null : parseFloat(target.value);
    
    // Não permite valores negativos
    if (value !== null && value < 0) {
      // Restaura o valor anterior
      target.value = this.gridData().rows[rowIndex].cells[columnIndex].value?.toString() || '';
      return;
    }
    
    // Atualiza o valor na grid
    this.gridData().rows[rowIndex].cells[columnIndex].value = value;
    
    // Emite o evento de mudança
    this.cellChanged.emit({
      rowIndex,
      columnIndex,
      value,
      rowLabel: this.gridData().rows[rowIndex].label,
      columnLabel: this.gridData().months[columnIndex]
    });
  }

  toggleCell(rowIndex: number, columnIndex: number, event: MouseEvent): void {
    event.stopPropagation(); // Evita que o evento propague para a célula/linha
    const cell = this.gridData().rows[rowIndex].cells[columnIndex];
    cell.disabled = !cell.disabled;
  }

  toggleRow(rowIndex: number): void {
    const row = this.gridData().rows[rowIndex];
    row.disabled = !row.disabled;
    
    // Atualiza o estado de todas as células na linha
    row.cells.forEach(cell => {
      cell.disabled = row.disabled;
    });
  }

  toggleColumn(columnIndex: number): void {
    // Verifica se todas as células da coluna estão desabilitadas
    const allDisabled = this.gridData().rows.every(row => row.cells[columnIndex].disabled);
    
    // Inverte o estado atual
    this.gridData().rows.forEach(row => {
      row.cells[columnIndex].disabled = !allDisabled;
    });
  }

  // Método auxiliar para formatar números para exibição
  formatNumber(value: number | null): string {
    if (value === null) return '';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Método para calcular o total de uma linha
  getRowTotal(rowIndex: number): number {
    return this.gridData().rows[rowIndex].cells
      .map(cell => cell.value || 0)
      .reduce((sum, value) => sum + value, 0);
  }

  // Método para calcular o total de uma coluna
  getColumnTotal(columnIndex: number): number {
    return this.gridData().rows
      .map(row => row.cells[columnIndex].value || 0)
      .reduce((sum, value) => sum + value, 0);
  }
  
  // Método para verificar se uma coluna está totalmente desabilitada
  isColumnDisabled(columnIndex: number): boolean {
    return this.gridData().rows.every(row => row.cells[columnIndex]?.disabled || false);
  }
  
  // Método para obter o total geral
  getGrandTotal(): number {
    return this.gridData().rows.reduce((sum, row) => 
      sum + this.getRowTotal(this.gridData().rows.indexOf(row)), 0);
  }

  getCellEditable(rowIndex: number, columnIndex: number): boolean {
    return (this.gridData().editable ?? true) && (this.gridData().rows[rowIndex].cells[columnIndex].editable ?? true);
  }
}