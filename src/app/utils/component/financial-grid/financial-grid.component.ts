// financial-grid.component.ts
import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getMonth } from 'date-fns';
import { MaskNumberDirective } from '../../directive/mask-number.directive';
import { CellChangeEvent, CellData, GridData, RowData } from './financial-gird.model';

@Component({
  selector: 'app-financial-grid',
  standalone: true,
  imports: [
    FormsModule,
    MaskNumberDirective
  ],
  templateUrl: './financial-grid.component.html',
  styleUrl: './financial-grid.component.scss',
})
export class FinancialGridComponent {

  @Input() set gridData(data: GridData) {
    this._gridData = data || this.initializeDefaultData();
  }
  get gridData(): GridData {
    return this._gridData;
  }
  private _gridData: GridData = this.initializeDefaultData();

  tabIndexInitial = input<number>(0);

  currentMonthIndex = input<number>(getMonth(new Date()));

  showHeader = input<boolean>(true);

  showFooter = input<boolean>(true);

  showTotalColumn = input<boolean>(true);

  editable = input<boolean>(true);

  @Output() cellChange = new EventEmitter<CellChangeEvent>();

  // Meses abreviados em português
  readonly defaultMonths = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  focusedCell: { rowIndex: number; columnIndex: number } | null = null;

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
        disabled: false,
        operation: 'plus'
      });
    }

    return {
      title: 'Planilha Financeira',
      months: this.defaultMonths,
      rows: rows
    };
  }

  onCellChange(rowIndex: number, columnIndex: number, value: number): void {
    // Atualiza o valor na grid
    this.gridData.rows[rowIndex].cells[columnIndex].value = value;

    // Emite o evento de mudança
    this.cellChange.emit({
      rowIndex,
      columnIndex,
      value,
      rowLabel: this.gridData.rows[rowIndex].label,
      columnLabel: this.gridData.months[columnIndex]
    });
  }

  onCellFocus(rowIndex: number, columnIndex: number): void {
    this.focusedCell = { rowIndex, columnIndex };
  }

  onPaste(event: ClipboardEvent): void {
    const focusedCell = this.focusedCell;
    if (!focusedCell) return;

    const clipboardData = event.clipboardData;
    const pastedData = clipboardData?.getData('text');

    if (pastedData) {
      const rows = pastedData.split('\n').map(row => row.split('\t'));
      let { rowIndex, columnIndex } = focusedCell;

      rows.forEach((row) => {
        row.forEach((value) => {
          if (this.gridData.rows[rowIndex] && this.gridData.rows[rowIndex].cells[columnIndex]) {
            let [num, decimal] = value.split(',');
            if (!decimal) {
              decimal = '00';
            }
            num = num.replace(/\D/g, ''); // Remove caracteres não numéricos
            decimal = decimal.replace(/\D/g, ''); // Remove caracteres não numéricos
            value = num + '.' + decimal; // Concatena os números e decimal
            // value = value.replace(/,/g, '.'); // Substitui vírgula por ponto
            this.onCellChange(rowIndex, columnIndex, parseFloat(value) || 0);
          }
          columnIndex++;
        });
        rowIndex++;
        columnIndex = focusedCell.columnIndex; // Reset column index for the next row
      });
    }

    event.preventDefault();
  }

  // Método auxiliar para formatar números para exibição
  formatNumber(value: number | null): string {
    if (value === null) return '';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Método para calcular o total de uma linha
  getRowTotal(rowIndex: number): number {
    const operation = this.gridData.rows[rowIndex].operation;
    if (operation === 'none') return 0; // Se a operação for 'none', retorna 0

    return this.gridData.rows[rowIndex].cells
      .map(cell => (operation === 'plus' ? 1 : -1) * (cell.value || 0))
      .reduce((sum, value) => sum + value, 0);
  }

  // Método para calcular o total de uma coluna
  getColumnTotal(columnIndex: number): number {
    return Math.abs(this.gridData.rows
      .map(row =>
        (row.operation === 'plus' ? 1 : row.operation === 'minus' ? -1 : 0) * (row.cells[columnIndex].value || 0))
      .reduce((sum, value) => sum + value, 0));
  }

  // Método para verificar se uma coluna está totalmente desabilitada
  isColumnDisabled(columnIndex: number): boolean {
    return this.gridData.rows.every(row => row.cells[columnIndex]?.disabled || false);
  }

  // Método para obter o total geral
  getGrandTotal(): number {
    return this.gridData.rows.reduce((sum, row) =>
      sum + this.getRowTotal(this.gridData.rows.indexOf(row)), 0);
  }

  getCellEditable(rowIndex: number, columnIndex: number): boolean {
    return (this.editable() ?? true);
  }

  tabIndex(rowIndex: number, columnIndex: number): number {
    return columnIndex * (this.gridData.rows.length) + rowIndex + 1 + 12 * this.tabIndexInitial();
  }

  trackByRow(index: number, row: RowData): string {
    return row.label; // Use uma propriedade única para identificar a linha
  }

  trackByCell(index: number, cell: CellData): number {
    return index; // Use o índice ou uma propriedade única para identificar a célula
  }

}