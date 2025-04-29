import { Component, computed, inject } from '@angular/core';
import { ProfitabilityClassesComponent } from "../profitability-classes/profitability-classes.component";
import { FinancialGridComponent } from '../../utils/component/financial-grid/financial-grid.component';
import { CellChangeEvent, CellData, RowData } from '../../utils/component/financial-grid/financial-gird.model';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { getMonth } from 'date-fns';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [
    ProfitabilityClassesComponent,
    FinancialGridComponent
  ],
  templateUrl: './profitability.component.html',
  styleUrl: './profitability.component.scss'
})
export class ProfitabilityComponent {

  private profitabilityService = inject(ProfitabilityService);

  current = this.profitabilityService.current;

  historical = this.profitabilityService.historical;

  currentMonth = getMonth(new Date());

  financialData = computed(() => {
    const current = this.current();
    const historical = this.historical();

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


}
