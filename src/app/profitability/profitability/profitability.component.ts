import { Component, computed, inject } from '@angular/core';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { CellChangeEvent } from '../../utils/component/financial-grid/financial-gird.model';
import { FinancialGridComponent } from '../../utils/component/financial-grid/financial-grid.component';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [
    FinancialGridComponent
  ],
  templateUrl: './profitability.component.html',
  styleUrl: './profitability.component.scss'
})
export class ProfitabilityComponent {

  private profitabilityService = inject(ProfitabilityService);

  financialGridData = computed(() => this.profitabilityService.financialGridData());

  cellChanged(event: CellChangeEvent) {
    console.log('Cell changed:', event);
  }

}
