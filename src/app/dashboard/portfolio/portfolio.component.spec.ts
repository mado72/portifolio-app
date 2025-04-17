import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioComponent } from './portfolio.component';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { QuoteService } from '../../service/quote.service';
import { BalancesComponent } from '../../cashflow/balances/balances.component';
import { FinancialForecastSummaryComponent } from '../../cashflow/financial-forecast-summary/financial-forecast-summary.component';
import { PortfolioRegisterTableComponent } from '../../portfolio/portfolio-register-table/portfolio-register-table.component';
import { SummarizePortfolioClassComponent } from '../../portfolio/summarize-portfolio-class/summarize-portfolio-class.component';

class MyService {
  getAllocationSummary = () => ([]);
  getBalancesByCurrencyExchange = () => ([]);
  portfolioAllocation = () => ([]);
  getBalancesSummarized = () => 0;
  getForecastSummary = () => ([]);
  getAllBalances = () => [];
  portfolios = () => [];
  summarizeByClass = () => ({});
  enhanceExchangeInfo = () => ({});
  exchangeView = () => {}

  total = () => ({});

}
describe('PortfolioComponent', () => {
  let component: PortfolioComponent;
  let fixture: ComponentFixture<PortfolioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioComponent,
        BalancesComponent,
        FinancialForecastSummaryComponent,
        PortfolioRegisterTableComponent,
        SummarizePortfolioClassComponent        
      ],
      providers: [
        { provide: QuoteService, useClass: MyService },
        { provide: BalanceService, useClass: MyService },
        { provide: PortfolioService, useClass: MyService },
        provideAnimationsAsync()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open all accordion panels on initialization', () => {
    const accordionSpy = spyOn(component.accordion(), 'openAll');
    component.ngOnInit();
    expect(accordionSpy).toHaveBeenCalled();
  });

  it('should have a defined accordion instance', () => {
    expect(component.accordion).toBeDefined();
  });
});
