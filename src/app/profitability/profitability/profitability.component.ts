import { Component, computed, inject } from '@angular/core';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { CellChangeEvent, GridData } from '../../utils/component/financial-grid/financial-gird.model';
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

  financialGridData = computed(() => this.profitabilityService.financialGridData() as GridData);

  cellChanged(event: CellChangeEvent) {
    console.log('Cell changed:', event);
  }

  contributionGridData = computed(() => this.profitabilityService.contributionGridData() as GridData);

  growthGridData = computed(() => this.profitabilityService.growthGridData() as GridData);

  isLoading = computed(() => !this.profitabilityService.financialGridData() 
    || !this.profitabilityService.contributionGridData()
    || !this.profitabilityService.growthGridData());

  onFinancialCellChanged(event: CellChangeEvent) {
    console.log('Financial cell changed:', event);
    this.profitabilityService.updateFinancialGridData(event);
  }

  onContributionCellChanged(event: CellChangeEvent) {
    console.log('Contribution cell changed:', event);
    // this.profitabilityService.updateContributionGridData(event);
  }
}
