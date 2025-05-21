import { Component, computed, inject, signal } from '@angular/core';
import { AggregatedTransactionsRows, ProfitabilityService } from '../../service/profitalibilty.service';
import { CellChangeEvent, CellData, GridData, RowData } from '../../utils/component/financial-grid/financial-gird.model';
import { FinancialGridComponent } from '../../utils/component/financial-grid/financial-grid.component';
import { PortfolioEvolutionChartComponent } from '../../components/portfolio-evolution-chart/portfolio-evolution-chart.component';
import { getYear } from 'date-fns';
import { ExchangeService } from '../../service/exchange.service';
import { JsonPipe } from '@angular/common';
import { ClassifyService } from '../../service/classify.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleChevronLeft, faCircleChevronRight } from '@fortawesome/free-solid-svg-icons';
import { MatButtonModule } from '@angular/material/button';
import { MonthsNumberArray } from '../../model/investment.model';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [
    FinancialGridComponent,
    PortfolioEvolutionChartComponent,
    FontAwesomeModule,
    MatButtonModule
  ],
  templateUrl: './profitability.component.html',
  styleUrl: './profitability.component.scss'
})
export class ProfitabilityComponent {

  private classifierService = inject(ClassifyService);

  private profitabilityService = inject(ProfitabilityService);

  private exchangeService = inject(ExchangeService);
  
  readonly chevronLeft = faCircleChevronLeft;

  readonly chevronRight = faCircleChevronRight;

  currency = computed(() => this.exchangeService.currencyDefault());

  currentYear = getYear(new Date());

  selectedYear = this.profitabilityService.selectedYear;
  
  portfolioEvolutionData = computed(() => {
    const evolutionData = this.computeEvolutionData(this.profitabilityService.profitabilityTotal());
    if (!evolutionData) {
      return null;
    }
    return {
      ...evolutionData,
      values: evolutionData.values.slice()
    };
  });

  profitabilityData = computed(() => {
    const classifierMap = this.classifierService.classifiersMap();
    const entries = Object.entries(this.profitabilityService.profitabilitySource()[this.selectedYear()] || {})
      .reduce((acc, [classifyId, values]) => {
        acc.push({ label: classifierMap[classifyId].name, values: values.slice() });
        return acc;
      }, [] as { label: string, values: number[] }[]);
    return entries;
  });

  accumulatedData = computed(() => this.computeAccumulatedData(this.profitabilityService.accumulatedValues()));

  financialGridData = computed(() => {
    const aggregatedTransactionsRows = this.profitabilityService.aggregatedTransactionsRows();
    const profitabilityRows = this.profitabilityService.profitabilityRowsData();

    if (!aggregatedTransactionsRows || !profitabilityRows) {
      return null;
    }

    return this.computeFinancialGrid(
      aggregatedTransactionsRows,
      Object.values(profitabilityRows)
    );
  });

  cellChanged(event: CellChangeEvent) {
    console.log('Cell changed:', event);
  }

  contributionGridData = computed(() => this.equityContributionGridData(this.profitabilityService.equityContributionRows()));

  growthGridData = computed(() => this.computeGrowthGridData({
    growth: this.profitabilityService.growthRateValues(),
    variance: this.profitabilityService.varianceValues(),
    varianceRate: this.profitabilityService.varianceRateValues(),
    accumulated: this.profitabilityService.accumulatedValues(),
    yield: this.profitabilityService.yieldValues()
  }));

  isLoading = computed(() => !this.financialGridData()
    || !this.contributionGridData()
    || !this.growthGridData());

  onContributionCellChanged(event: CellChangeEvent) {
    console.log('Contribution cell changed:', event);
    // this.profitabilityService.updateContributionGridData(event);
  }

  financialGridCellChanged(event: CellChangeEvent) {
    this.profitabilityService.updateFinancialGridData(event);
  }

  previousYear() {
    const year = this.selectedYear() - 1;
    this.selectedYear.set(year);
  }

  nextYear() {
    const year = this.selectedYear() + 1;
    this.selectedYear.set(year);
  }

  constructor() {}

  private computeGrowthGridData(data: { growth: number[]; variance: number[] | null; varianceRate: number[] | null; accumulated: number[] | null; yield: number[] | null; }): GridData | null {
    const { growth, variance, varianceRate, accumulated, yield: yieldRate } = data;
    if (!growth || !variance || !varianceRate || !accumulated || !yieldRate) {
      return null;
    }

    // Compute the growth grid data
    const growthGridData: GridData = {
      title: 'Crescimento',
      months: this.profitabilityService.months(),
      rows: [
        { label: 'CRESCIMENTO', disabled: true, operation: 'none', cells: this.convertToDisabledCellData(growth) },
        { label: 'VAR', disabled: true, operation: 'none', cells: this.convertToDisabledCellData(variance) },
        { label: 'VAR%', disabled: true, operation: 'none', cells: this.convertToDisabledCellData(varianceRate), suffix: '%' },
        { label: 'ACUMULADO', disabled: true, operation: 'none', cells: this.convertToDisabledCellData(accumulated) },
        { label: 'RENDIMENTO', disabled: true, operation: 'none', cells: this.convertToDisabledCellData(yieldRate), suffix: '%' }
      ]
    };

    return growthGridData;
  }

  private convertToDisabledCellData(values: number[]): CellData[] {
    return values.map(value => ({
      value: value !== null ? Math.round(value * 100) / 100 : null,
      disabled: true
    }));
  }

  /**
   * A computed property that generates data for the contribution grid.
   * 
   * This property calculates and returns an object containing the title, 
   * months, and rows of data for the grid. The rows are composed of 
   * contributions, accumulated contributions, and incomes, if available.
   * 
   * The computation depends on the following:
   * - Ensures that the source service data is loaded before proceeding.
   * - Aggregates transaction rows to extract contributions and incomes.
   * - Calculates accumulated contributions based on the contributions data.
   * 
   * @returns An object containing:
   * - `title`: A string representing the title of the grid.
   * - `months`: An array of months derived from the `months()` method.
   * - `rows`: An array of row data, including contributions, accumulated contributions, and incomes.
   *           Returns `null` if the source service data is not loaded.
   */
  private equityContributionGridData (equityContributionRows: RowData[] | null) {
    if (!equityContributionRows) {
      return null;
    }

    return {
      title: 'Aportes e Proventos',
      months: this.profitabilityService.months(),
      rows: equityContributionRows
    };
  }

  /**
   * A computed property that provides data for the portfolio evolution chart.
   * 
   * This property calculates the evolution of the portfolio's value over time.
   * If the source data is not loaded, it returns `null`. If the total profitability
   * data is unavailable or empty, it returns a default object with a label and an
   * array of 12 zero values. Otherwise, it returns an object containing the label
   * and the calculated total values.
   * 
   * @returns An object containing the label and an array of values representing
   *          the portfolio's evolution, or `null` if the source data is not loaded.
   */
  computeEvolutionData(total: MonthsNumberArray) {
    if (!total?.length) {
      return {
        label: 'Evolução do Patrimônio',
        values: Array(12).fill(0) as MonthsNumberArray,
      };
    }

    return {
      label: 'Evolução do Patrimônio',
      values: total
    };
  }

  /**
   * A computed property that provides accumulated profitability data.
   * 
   * This property calculates and returns an object containing a label and an array of values
   * representing the accumulated profitability. If the source data is not loaded or the 
   * financial metric rows are unavailable, it defaults to a label of "Rentabilidade Acumulada"
   * and an array of 12 zeros.
   * 
   * @readonly
   * @returns An object with the following structure:
   * - `label`: A string indicating the label for the accumulated profitability.
   * - `values`: An array of numbers representing the accumulated profitability values, 
   *   normalized to percentages (divided by 100).
   */
  private computeAccumulatedData(accumulatedValues: number[] | null) {
    if (!accumulatedValues) {
      return {
        label: 'Rentabilidade Acumulada',
        values: Array(12).fill(0) as number[],
      };
    }

    return {
      label: 'Rentabilidade Acumulada',
      values: accumulatedValues.map(value => value / 100),
    };
  };

  private computeFinancialGrid(aggregatedTransactionsRows: AggregatedTransactionsRows<RowData>, profitabilityRows: RowData[]): GridData | null {
    return {
      title: 'Rendimentos e Resgates',
      months: this.profitabilityService.months(),
      rows: profitabilityRows.concat(
        aggregatedTransactionsRows?.sell || [],
        aggregatedTransactionsRows?.withdrawals || []
      )
    };
  }

}
