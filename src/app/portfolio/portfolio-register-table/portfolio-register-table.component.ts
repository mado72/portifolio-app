import { animate, state, style, transition, trigger } from '@angular/animations';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { PortfolioAllocationsArrayItemType, PortfolioAllocationType, PortfolioType } from '../../model/source.model';
import { PortfolioService } from '../../service/portfolio-service';
import { InvestmentPortfolioTableComponent } from '../investment-portfolio-table/investment-portfolio-table.component';

type DatasourceMasterType = Omit<PortfolioType, "allocations" | "percAllocation"> & {
  allocations: PortfolioAllocationType[];
  percAllocation: number;
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
    InvestmentPortfolioTableComponent
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0', maxHeight: '0', opacity: '0' })),
      state('expanded', style({ height: '*', maxHeight: '', opacity: '1'})),
      transition('expanded <=> collapsed', animate('1s cubic-bezier(.28,.5,.83,.67)')),
      transition('collapsed <=> expanded', animate('1s cubic-bezier(.17,.67,.83,.67)')),
    ]),
  ],
  templateUrl: './portfolio-register-table.component.html',
  styleUrl: './portfolio-register-table.component.scss'
})
export class PortfolioRegisterTableComponent implements OnInit {
  deletePortfolio(_t15: PortfolioAllocationsArrayItemType) {
    throw new Error('Method not implemented.');
  }
  editPortfolio(_t15: PortfolioAllocationsArrayItemType) {
    throw new Error('Method not implemented.');
  }
  addPortfolio() {
    throw new Error('Method not implemented.');
  }
  
  private portfolioService = inject(PortfolioService);

  private fb = inject(FormBuilder);
  
  readonly iconClose = faChevronRight;
  readonly iconOpen = faChevronDown;
  
  readonly displayedColumns = ['name', 'percPlanned', 'percAllocation', 'marketValue', 'profit', 'performance'];

  // displayedColumns = ['id', 'name', 'actions'];
  detailDisplayedColumns = ['id', 'description'];

  total = computed(() => this.portfolioService.total())

  portfolios = computed(() => this.portfolioService.portfolioAllocation());

  expandedElement: DatasourceMasterType | null = null;

  editable = input<boolean>(false)

  s = [];
  value = 0;

  formSliders = this.fb.group({
    sliders : this.fb.array([]),
  });

  sliders = signal<{portfolio: PortfolioAllocationsArrayItemType, percPlanned: number}[]>([]);

  get slidersControl() {
    return this.formSliders.get('sliders') as FormArray<FormControl<number | null>>;
  }

  constructor() {
    this.portfolios().map(portfolio=>portfolio.percPlanned).forEach(perc=>{
      this.slidersControl.push(this.fb.control(perc as number));
    })
    effect(() => {
      this.slidersControl.clear();
      this.portfolios().map(portfolio=>portfolio.percPlanned).forEach(perc=>{
        this.slidersControl.push(this.fb.control(perc as number));
      })
    })
  }

  ngOnInit(): void {

  }

  updateSlider(index: number, value: number): void {
    const portfolio = this.portfolios()[index];
    if (portfolio.percPlanned !== value) {
      portfolio.percPlanned = value;
      this.portfolioService.updatePortfolio(portfolio.id, {...portfolio});
    }
  }
  
  trackBy(_: number, item: PortfolioAllocationsArrayItemType) {
    return item.id;
  }

  expanded : string[] = [];

  isExpanded(portfolio: PortfolioAllocationsArrayItemType) {
    return this.expanded.includes(portfolio.id);
  }

  toggleExpanded(portfolio: PortfolioAllocationsArrayItemType) {
    if (this.isExpanded(portfolio)) {
      this.expanded = this.expanded.filter(id => id !== portfolio.id);
    } else {
      this.expanded.push(portfolio.id);
    }
  }
}
