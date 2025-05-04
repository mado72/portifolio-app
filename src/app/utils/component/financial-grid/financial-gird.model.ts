// financial-grid.model.ts
export interface CellData {
    value: number | null;
    disabled: boolean;
  }
  
  export interface RowData {
    label: string;
    cells: CellData[];
    disabled: boolean;
    operation: "plus" | "minus" | "none";
    prefix?: string;
    suffix?: string;
    attached?: any;
  }
  
  export interface GridData {
    title: string;
    months: string[];
    rows: RowData[];
  }
  
  export type CellChangeEvent = {
    rowIndex: number;
    columnIndex: number;
    value: number | null;
    rowLabel: string;
    columnLabel: string;
  }