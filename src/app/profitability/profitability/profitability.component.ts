import { Component, computed, inject } from '@angular/core';
import { ProfitabilityClassesComponent } from "../profitability-classes/profitability-classes.component";
import { FinancialGridComponent } from '../../utils/component/financial-grid/financial-grid.component';
import { CellChangeEvent, CellData, RowData } from '../../utils/component/financial-grid/financial-gird.model';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { getMonth } from 'date-fns';
import { ProfitabilityIncomeWithdrawComponent } from '../profitability-income-withdraw/profitability-income-withdraw.component';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [
    ProfitabilityClassesComponent,
    ProfitabilityIncomeWithdrawComponent,
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


  cellChanged(event: CellChangeEvent) {
    console.log('Cell changed:', event);
  }

}
