import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AssetEnum, IncomeEnum } from '../../model/investment.model';
import { PortfolioService } from '../../service/portfolio-service';
import { AssetTypePipe } from '../../utils/asset-type.pipe';

export type EarningsFilterType = { portfolioReference: string | null; dateReference: Date, typeReference: AssetEnum | null };

@Component({
  selector: 'app-earnings-filter',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    AssetTypePipe,
    FormsModule,
  ],
  templateUrl: './earnings-filter.component.html',
  styleUrl: './earnings-filter.component.scss'
})
export class EarningsFilterComponent {

  private portfolioService = inject(PortfolioService);

  filter: EarningsFilterType = {
    portfolioReference: null,
    dateReference: new Date(),
    typeReference: null
  }

  @Output() filterChanged = new EventEmitter<EarningsFilterType>();

  readonly assetTypes = Object.values(AssetEnum);

  readonly earningTypes = Object.values(IncomeEnum);

  readonly DIVIDENDS = IncomeEnum.DIVIDENDS;

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
