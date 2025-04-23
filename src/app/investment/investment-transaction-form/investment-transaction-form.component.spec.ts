import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AssetService } from '../../service/asset.service';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { InvestmentTransactionFormComponent } from './investment-transaction-form.component';
import { ExchangeService } from '../../service/exchange.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';

class MyService {
  getAllBalances () {}
  getAccounts = () => []
  getAllPortfolios = () => []
}
describe('InvestmentTransactionFormComponent', () => {
  let component: InvestmentTransactionFormComponent;
  let fixture: ComponentFixture<InvestmentTransactionFormComponent>;
  let exchangeServiceMock: jasmine.SpyObj<ExchangeService>;
  let balanceServiceMock: jasmine.SpyObj<BalanceService>;
  let portfolioServiceMock: jasmine.SpyObj<PortfolioService>;
  let assetServiceMock: jasmine.SpyObj<AssetService>;

  beforeEach(async () => {
    exchangeServiceMock = jasmine.createSpyObj(ExchangeService, [
      'exchanges'
    ])
    balanceServiceMock = jasmine.createSpyObj(BalanceService,[
      'getAccounts'
    ]);
    portfolioServiceMock = jasmine.createSpyObj(PortfolioService,[
      'portfolios'
    ]);
    assetServiceMock = jasmine.createSpyObj(AssetService,[
      'assets'
    ]);

    await TestBed.configureTestingModule({
      imports: [InvestmentTransactionFormComponent],
      providers: [
        provideAnimationsAsync(),
        provideNativeDateAdapter(),
        provideHttpClientTesting(),
        { provide: ExchangeService, use: exchangeServiceMock},
        { provide: BalanceService, use: balanceServiceMock},
        { provide: PortfolioService, use: portfolioServiceMock},
        { provide: AssetService, use: assetServiceMock},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentTransactionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
