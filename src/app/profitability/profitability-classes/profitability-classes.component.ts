import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { format, getMonth, setMonth } from 'date-fns';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { CellChangeEvent, CellData, RowData } from '../../utils/component/financial-grid/financial-gird.model';
import { FinancialGridComponent } from '../../utils/component/financial-grid/financial-grid.component';

@Component({
  selector: 'app-profitability-classes',
  standalone: true,
  imports: [
    FinancialGridComponent,
  ],
  templateUrl: './profitability-classes.component.html',
  styleUrl: './profitability-classes.component.scss'
})
export class ProfitabilityClassesComponent {

  currentMonth = getMonth(new Date());

  dataSource = input<Record<string, number[]>>();

  financialData = computed(() => {
    const historical = this.dataSource();

    if (!historical) {
      return {
        title: 'Classes',
        months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        rows: []
      };
    }

    const current = Object.entries(historical).reduce((acc, entry) => {
      const [classify, values] = entry;
      acc[classify] = values[this.currentMonth];
      return acc;
    }, {} as Record<string, number>);

    return {
      title: 'Classes',
      months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      rows: Object.entries(historical).reduce((rows, entry) => {
        const [classify, values] = entry;
        rows.push({
          label: classify,
          disabled: false,
          cells: values.reduce((acc, value, index) => {
            acc.push({value: index >= this.currentMonth ? current[classify] || 0 : value, disabled: index > this.currentMonth});
            return acc;
          }, [] as CellData[])
        });
        return rows;
      }, [] as RowData[])
    };
  });

  cellChanged(event: CellChangeEvent) {
    console.log('Cell changed:', event);
  }

  constructor() { }

}
