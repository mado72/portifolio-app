import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BalanceService } from '../../service/balance.service';
import { provideAssetServiceMock, provideExchangeServiceMock, providePortfolioServiceMock } from '../../service/service-mock.spec';
import { InvestmentTransactionFormComponent } from './investment-transaction-form.component';

class BalanceServiceMock {
  getAllBalances () {}
  getAccounts = () => []
  getAllPortfolios = () => []
}
describe('InvestmentTransactionFormComponent', () => {
  let component: InvestmentTransactionFormComponent;
  let fixture: ComponentFixture<InvestmentTransactionFormComponent>;
  let balanceServiceMock: jasmine.SpyObj<BalanceService>;
  let accounts = signal([]);

  beforeEach(async () => {
    provideExchangeServiceMock(),
    providePortfolioServiceMock(),
    provideAssetServiceMock(),
    balanceServiceMock = jasmine.createSpyObj(BalanceServiceMock,[
      'getAccounts'
    ]);
    balanceServiceMock.getAccounts.and.returnValue(accounts());

    await TestBed.configureTestingModule({
      imports: [InvestmentTransactionFormComponent],
      providers: [
        provideAnimationsAsync(),
        provideNativeDateAdapter(),
        provideHttpClientTesting(),
        providePortfolioServiceMock(),
        provideAssetServiceMock(),
        { provide: BalanceService, useFactory: () => balanceServiceMock },
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
