import { animate, state, style, transition, trigger } from '@angular/animations';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, inject, input } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ExchangeStructureType } from '../../model/investment.model';
import { PortfolioAllocationType, PortfolioType, SummarizedDataType } from '../../model/source.model';
import { PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';
import { SourceService } from '../../service/source.service';
import { ExchangeComponent } from "../../utils/component/exchange/exchange.component";
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';
import { TransactionService } from '../../service/transaction.service';

type DatasourceMasterType = Omit<PortfolioType, "allocations" | "percAllocation" | "total"> & {
  allocations: PortfolioAllocationType[];
  percAllocation: number;
  total: Omit<SummarizedDataType, "initialValue" | "marketValue" | "profit"> & {
    initialValue: ExchangeStructureType;
    marketValue: ExchangeStructureType;
    profit: ExchangeStructureType;
  }
}

@Component({
  selector: 'app-portfolio-register-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatIconModule,
    MatSliderModule,
    FaIconComponent,
    PercentPipe,
    DecimalPipe,
    ReactiveFormsModule,
    InvestmentPortfolioTableComponent,
    ExchangeComponent,
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

  private sourceService = inject(SourceService);

  private portfolioService = inject(PortfolioService);

  private quoteService = inject(QuoteService);

  private transactionService = inject(TransactionService);

  private fb = inject(FormBuilder);

  readonly iconClose = faChevronRight;

  readonly iconOpen = faChevronDown;

  readonly displayedColumns = ['name', 'percPlanned', 'percAllocation', 'marketValue', 'profit', 'performance'];

  detailDisplayedColumns = ['id', 'description'];

  currency = computed(() => this.sourceService.currencyDefault());

  total = computed(() => this.quoteService.enhanceExchangeInfo(this.portfolioService.total(), this.sourceService.currencyDefault(), ["marketValue", "profit"]));

  exchangeView = computed(() => this.quoteService.exchangeView())

  portfolios = computed(() => this.portfolioService.portfolioAllocation()
    .map(portfolio => ({
      ...portfolio,
      total: {
        ...portfolio.total,
        ...this.quoteService.enhanceExchangeInfo(portfolio.total, portfolio.currency, ["initialValue", "marketValue", "profit"])
      }
    } as DatasourceMasterType)));

  expandedElement: DatasourceMasterType | null = null;

  editable = input<boolean>(false);

  formSliders = this.fb.group({
    sliders: this.fb.array([]),
  });

  get slidersControl() {
    return this.formSliders.get('sliders') as FormArray<FormControl<number | null>>;
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

  updateSlider(index: number, value: number): void {
    const portfolio = this.portfolios()[index];
    if (portfolio.percPlanned !== value) {
      portfolio.percPlanned = value;
      this.portfolioService.updatePortfolio(portfolio.id, { ...portfolio });
    }
  }

  trackBy(_: number, item: DatasourceMasterType) {
    return item.id;
  }

  expanded: string[] = [];

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

  addPortfolio() {
    this.portfolioService.openPortfolioDialog({
      title: 'Adicionar carteira',
      portfolioInfo: {
        name: '',
        currency: this.sourceService.currencyDefault(),
        percPlanned: 0,
      }
    });
  }

  editPortfolio(portfolioId: string) {
    this.portfolioService.openPortfolioDialog({
      title: 'Editar carteira',
      portfolioInfo: portfolioId
    });
  }

  deletePortfolio(portfolioId: string) {
    this.portfolioService.removePortfolio(portfolioId);
  }
  
  addTransaction() {
    this.transactionService.createTransaction();
  }

  fillToHundredPercent(index: number) {
    const total = this.portfolios().filter((_, idx) => idx !== index).reduce((acc, p) => acc + p.percPlanned, 0);
    const portfolio = this.portfolios()[index]
    if (!portfolio) return;
    portfolio.percPlanned = 100 - total;
    this.slidersControl.at(index).setValue(portfolio.percPlanned);
    this.portfolioService.updatePortfolio(portfolio.id, { ...portfolio });
  }

}
