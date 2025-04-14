import { animate, state, style, transition, trigger } from '@angular/animations';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, computed, effect, ElementRef, HostListener, inject, input, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { InvestmentTransactionFormComponent, InvestmentTransactionFormResult } from "../../investment/investment-transaction-form/investment-transaction-form.component";
import { ExchangeStructureType } from '../../model/investment.model';
import { PortfolioAllocationType, PortfolioType, SummarizedDataType } from '../../model/source.model';
import { PortfolioChangeType, PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';
import { SourceService } from '../../service/source.service';
import { TransactionService } from '../../service/transaction.service';
import { ExchangeComponent } from "../../utils/component/exchange/exchange.component";
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';

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
    InvestmentTransactionFormComponent
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
export class PortfolioRegisterTableComponent implements AfterViewInit {

  private sourceService = inject(SourceService);

  private portfolioService = inject(PortfolioService);

  private transactionService = inject(TransactionService);

  private quoteService = inject(QuoteService);

  private fb = inject(FormBuilder);

  readonly iconClose = faChevronRight;

  readonly iconOpen = faChevronDown;

  readonly displayedColumns = ['name', 'percPlanned', 'percAllocation', 'marketValue', 'profit', 'performance'];

  detailDisplayedColumns = ['id', 'description'];

  currency = computed(() => this.sourceService.currencyDefault());

  total = computed(() => this.portfolioService.total());

  viewExchange: "original" | "exchanged" = "original";

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

  editingTransaction = signal(false);

  formSliders = this.fb.group({
    sliders: this.fb.array([]),
  });

  get slidersControl() {
    return this.formSliders.get('sliders') as FormArray<FormControl<number | null>>;
  }

  changeDetectRef = inject(ChangeDetectorRef);

  @ViewChild("tablePortfolio", { static: true }) tablePortfolio !: ElementRef<HTMLElement>;

  @ViewChild("exchangeButton") exchangeButton !: ElementRef<HTMLElement>;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.adjustButtonPosition();
  }

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

  ngAfterViewInit(): void {
    this.adjustButtonPosition();
  }

  protected async adjustButtonPosition() {
    await this.changeDetectRef.detectChanges();

    const button = this.exchangeButton?.nativeElement;
    const table = this.tablePortfolio?.nativeElement;

    if (button && table) {
      const btnRect = table.getBoundingClientRect();
      if (btnRect.bottom > window.innerHeight) {
        button.classList.add('fixed');
      } else {
        button.classList.remove('fixed');
      }
    }
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
    this.adjustButtonPosition();
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
    this.editingTransaction.set(true);
    // this.transactionService.openAddDialog()
  }

  fillToHundredPercent(index: number) {
    const total = this.portfolios().filter((_, idx) => idx !== index).reduce((acc, p) => acc + p.percPlanned, 0);
    const portfolio = this.portfolios()[index]
    if (!portfolio) return;
    portfolio.percPlanned = 100 - total;
    this.slidersControl.at(index).setValue(portfolio.percPlanned);
    this.portfolioService.updatePortfolio(portfolio.id, { ...portfolio });
  }

  toggleViewExchange() {
    this.viewExchange = this.viewExchange === "original" ? "exchanged" : "original";
  }

  cancelEditTransaction() {
    this.editingTransaction.set(false);
  }
  
  submitEditTransaction(result: InvestmentTransactionFormResult) {
    this.transactionService.saveTransaction(result);
    const ticker = result.ticker;
    Object.entries(result.allocations)
      .filter(([_, qty]) => qty > 0)
      .forEach(([portId, qty])=>{
        const portfolio = this.portfolioService.portfolios()[portId];
        if (!!portfolio) {
          const changes : PortfolioChangeType = {
            ...portfolio,
            allocations: [
              ...Object.values(portfolio.allocations),
              {
                ticker,
                percPlanned: 0,
                quantity: qty
              }
            ]
          };
          this.portfolioService.updatePortfolio(portId, changes);
        }
      })
    this.editingTransaction.set(false);
  }
}
