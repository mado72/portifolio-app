import { Component, computed, inject, signal } from '@angular/core';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { CellChangeEvent, GridData } from '../../utils/component/financial-grid/financial-gird.model';
import { FinancialGridComponent } from '../../utils/component/financial-grid/financial-grid.component';
import { PortfolioEvolutionChartComponent } from '../../components/portfolio-evolution-chart/portfolio-evolution-chart.component';
import { getYear } from 'date-fns';
import { ExchangeService } from '../../service/exchange.service';
import { JsonPipe } from '@angular/common';
import { ClassifyService } from '../../service/classify.service';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [
    FinancialGridComponent,
    PortfolioEvolutionChartComponent
  ],
  templateUrl: './profitability.component.html',
  styleUrl: './profitability.component.scss'
})
export class ProfitabilityComponent {

  private classifierService = inject(ClassifyService);

  private profitabilityService = inject(ProfitabilityService);

  private exchangeService = inject(ExchangeService);

  currency = computed(() => this.exchangeService.currencyDefault());
  
  portfolioEvolutionData = computed(() => {
    const evolutionData = this.profitabilityService.portfolioEvolutionData();
    if (!evolutionData) {
      return [];
    }
    return {
      ...evolutionData,
      values: evolutionData.values.slice()
    };
  });

  profitabilityData = computed(() => {
    const classifierMap = this.classifierService.classifiersMap();
    const entries = Object.entries(this.profitabilityService.profitabilitySource()[this.currentYear()])
      .reduce((acc, [classifyId, values]) => {
        acc.push({ label: classifierMap[classifyId].name, values: values.slice() });
        return acc;
      }, [] as { label: string, values: number[] }[]);
    return entries;
  });

  accumulatedData = this.profitabilityService.accumulatedData;
  
  financialGridData = computed(() => this.profitabilityService.financialGridData() as GridData);

  cellChanged(event: CellChangeEvent) {
    console.log('Cell changed:', event);
  }

  currentYear = signal<number>(getYear(new Date()));

  contributionGridData = computed(() => this.profitabilityService.contributionGridData() as GridData);

  growthGridData = computed(() => this.profitabilityService.growthGridData() as GridData);

  isLoading = computed(() => !this.profitabilityService.financialGridData() 
    || !this.profitabilityService.contributionGridData()
    || !this.profitabilityService.growthGridData());

  onContributionCellChanged(event: CellChangeEvent) {
    console.log('Contribution cell changed:', event);
    // this.profitabilityService.updateContributionGridData(event);
  }

  financialGridCellChanged(event: CellChangeEvent) {
    const value = event.value as number || 0;
    this.profitabilityService.updateFinancialGridData(event);
  }

  // // Dados simulados para o gráfico
  // portfolioEvolutionData = [
  //   { name: '2021', value: 50000 },
  //   { name: '2022', value: 75000 },
  //   { name: '2023', value: 100000 },
  //   { name: '2024', value: 125000 }
  // ];
}

