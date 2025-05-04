import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IncomeEnum } from '../../model/investment.model';
import { AssetEnum } from '../../model/source.model';
import { PortfolioService } from '../../service/portfolio-service';
import { AssetTypePipe } from '../../utils/pipe/asset-type.pipe';
import { provideDateFnsAdapter } from '../../adapter/date-fnd-adapter';
import { Currency } from '../../model/domain.model';


export type IncomeFilterType = { 
  portfolioReference: string | null; 
  dateReference: Date; 
  typeReference: AssetEnum | null; 
  currencyReference: Currency | null; // Adicionado o filtro por moeda
};

const YEAR_FORMATS = {
  parse: {
    dateInput: 'yyyy', // Formato de entrada corrigido
  },
  display: {
    dateInput: 'yyyy', // Formato de exibição no campo de entrada corrigido
    monthYearLabel: 'yyyy', // Formato do rótulo do mês/ano corrigido
    dateA11yLabel: 'yyyy', // Acessibilidade corrigida
    monthYearA11yLabel: 'yyyy', // Acessibilidade corrigida
  },
};


@Component({
  selector: 'app-income-year-sheet-filter',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    AssetTypePipe,
    FormsModule
  ],
  providers: [
    provideDateFnsAdapter(YEAR_FORMATS),
  ],
  templateUrl: './income-year-sheet-filter.component.html',
  styleUrl: './income-year-sheet-filter.component.scss'
})
export class IncomeYearSheetFilterComponent {

  private portfolioService = inject(PortfolioService);

  filter: IncomeFilterType = {
    portfolioReference: null,
    dateReference: new Date(),
    typeReference: null,
    currencyReference: null, // Inicializa com null
  };

  @Output() filterChanged = new EventEmitter<IncomeFilterType>();

  readonly assetTypes = Object.values(AssetEnum);

  readonly earningTypes = Object.values(IncomeEnum);

  readonly DIVIDENDS = IncomeEnum.DIVIDENDS;

  readonly currencies = Object.values(Currency); // Lista de moedas disponíveis

  porfolios = computed(() => Object.values(this.portfolioService.portfolios()));

  choosenYear(d: Date, picker: MatDatepicker<any>): void {
    this.filter.dateReference = d;
    picker.close();
    this.onFilterChange()
  }

  onFilterChange() {
    this.filterChanged.emit(this.filter);
  }
}

