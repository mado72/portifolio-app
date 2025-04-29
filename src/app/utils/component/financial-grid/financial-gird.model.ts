// financial-grid.model.ts
export interface CellData {
    value: number | null;
    disabled: boolean;
    editable?: boolean;
  }
  
  export interface RowData {
    label: string;
    cells: CellData[];
    disabled: boolean;
  }
  
  export interface GridData {
    title: string;
    months: string[];
    rows: RowData[];
    editable?: boolean;
  }
  
  export type CellChangeEvent = {
    rowIndex: number;
    columnIndex: number;
    value: number | null;
    rowLabel: string;
    columnLabel: string;
  }