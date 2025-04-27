import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BalancesComponent } from '../../cashflow/balances/balances.component';
import { FinancialForecastSummaryComponent } from '../../cashflow/financial-forecast-summary/financial-forecast-summary.component';
import { PortfolioRegisterComponent } from '../../portfolio/portfolio-register/portfolio-register.component';
import { SummarizePortfolioClassComponent } from '../../portfolio/summarize-portfolio-class/summarize-portfolio-class.component';
import { AssetService } from '../../service/asset.service';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';
import { PortfolioComponent } from './portfolio.component';
import { provideExchangeServiceMock } from '../../service/service-mock.spec';

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
  let assetServiceMock = jasmine.createSpyObj('AssetService', ['getAllocationSummary', 'getBalancesByCurrencyExchange', 'portfolioAllocation', 'getBalancesSummarized', 'getForecastSummary', 'getAllBalances', 'portfolios', 'summarizeByClass']);
  
  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [PortfolioComponent,
        BalancesComponent,
        FinancialForecastSummaryComponent,
        PortfolioRegisterComponent,
        SummarizePortfolioClassComponent        
      ],
      providers: [
        provideExchangeServiceMock(),
        { provide: AssetService, useValue: assetServiceMock },
        
        { provide: QuoteService, useClass: MyService },
        { provide: BalanceService, useClass: MyService },
        { provide: PortfolioService, useClass: MyService },
        provideAnimationsAsync(),
        
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
