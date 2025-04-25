import { animate, state, style, transition, trigger } from '@angular/animations';
import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, EventEmitter, inject, input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Currency } from '../../model/domain.model';
import { ExchangeStructureType, ExchangeView } from '../../model/investment.model';
import { PortfolioAllocation, PortfolioType, SummarizedDataType } from '../../model/source.model';
import { ExchangeComponent } from "../../utils/component/exchange/exchange.component";
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';

export type DatasourceMasterType = Omit<PortfolioType, "allocations" | "percAllocation" | "total"> & {
  allocations: PortfolioAllocation[];
  percAllocation: number;
  total: Omit<SummarizedDataType, "initialValue" | "marketValue" | "profit"> & {
    initialValue: ExchangeStructureType;
    marketValue: ExchangeStructureType;
    profit: ExchangeStructureType;
  }
}

export type PortfolioRegisterTotalType = {
  initialValue: ExchangeStructureType;
  marketValue: ExchangeStructureType;
  percPlanned: number;
  percAllocation: number;
  profit: ExchangeStructureType;
  performance: number;
}

@Component({
  selector: 'app-portfolio-register-table',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatIconModule,
    MatSliderModule,
    FaIconComponent,
    PercentPipe,
    DecimalPipe,
    ReactiveFormsModule,
    InvestmentPortfolioTableComponent,
    ExchangeComponent
],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0', maxHeight: '0', opacity: '0' })),
      state('expanded', style({ height: '*', maxHeight: '', opacity: '1' })),
      transition('expanded <=> collapsed', animate('1s cubic-bezier(.28,.5,.83,.67)')),
      transition('collapsed <=> expanded', animate('1s cubic-bezier(.17,.67,.83,.67)')),
    ]),
  ],
  templateUrl: './portfolio-register-table.component.html',
  styleUrl: './portfolio-register-table.component.scss'
})
export class PortfolioRegisterTableComponent {

  private fb = inject(FormBuilder);

  readonly iconClose = faChevronRight;

  readonly iconOpen = faChevronDown;

  readonly displayedColumns = ['name', 'percPlanned', 'percAllocation', 'marketValue', 'profit', 'performance'];

  detailDisplayedColumns = ['id', 'description'];

  currency = input<Currency | null>(null);
  
  total = input<PortfolioRegisterTotalType | null>(null);

  exchangeView = input<ExchangeView | null>(null);

  portfolios = input<DatasourceMasterType[]>([]);

  editable = input<boolean>(false);

  @Output() portfolioAllocationChanged = new EventEmitter<DatasourceMasterType>();
  @Output() editPorfolioRequest = new EventEmitter<DatasourceMasterType>();
  @Output() deletePortfolioRequest = new EventEmitter<DatasourceMasterType>();

  expandedElement: DatasourceMasterType | null = null;

  expanded: string[] = [];

  formSliders = computed(() => this.fb.group({
    sliders: this.fb.array(this.portfolios().map(portfolio => this.buildSlider(portfolio.percPlanned))),
  }));

  getSliderControlValue(index: number): number | null {
    return this.slidersControl.at(index)?.value;
  }

  sliderCreated(index: number): boolean {
    return this.slidersControl.at(index)?.value !== null;
  }
  
  sliderControl(index: number): FormControl<number | null> {
    return this.slidersControl.at(index) as FormControl<number | null>;
  }
  
  get slidersControl() {
    return this.formSliders().get('sliders') as FormArray<FormControl<number | null>>;
  }

  changeDetectRef = inject(ChangeDetectorRef);

  constructor() {
    this.portfolios().map(portfolio => portfolio.percPlanned).forEach(perc => {
      this.slidersControl.push(this.fb.control(perc as number));
    })
    effect(() => {
      this.slidersControl.clear();
      this.portfolios().map(portfolio => portfolio.percPlanned).forEach(perc => {
        this.slidersControl.push(this.fb.control(perc as number));
      })
    })
  }

  buildSlider(percPlanned: number): FormControl<number | null> {
    return this.fb.control(percPlanned as number);
  }

  updateSlider(index: number, value: number): void {
    const portfolio = this.portfolios()[index];
    if (portfolio.percPlanned !== value) {
      portfolio.percPlanned = value;
      this.portfolioAllocationChanged.emit(portfolio);
    }
  }

  trackBy(_: number, item: DatasourceMasterType) {
    return item.id;
  }

  isExpanded(portfolio: DatasourceMasterType) {
    return this.expanded.includes(portfolio.id);
  }

  toggleExpanded(portfolio: DatasourceMasterType) {
    if (this.isExpanded(portfolio)) {
      this.expanded = this.expanded.filter(id => id !== portfolio.id);
    } else {
      this.expanded.push(portfolio.id);
    }
  }

  fillToHundredPercent(portfolio: DatasourceMasterType) {
    if (!portfolio) return;
    const index = this.portfolios().findIndex((item) => item.id === portfolio.id);
    const total = this.portfolios().filter((_,idx) =>idx !== index).reduce((acc, p) => acc + p.percPlanned, 0);
    portfolio.percPlanned = 100 - total;
    this.slidersControl.at(index).setValue(portfolio.percPlanned);
    this.portfolioAllocationChanged.emit(portfolio);
  }

}
