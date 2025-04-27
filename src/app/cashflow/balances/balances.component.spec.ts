import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceService } from '../../service/balance.service';
import { QuoteService } from '../../service/quote.service';
import { BalancesComponent } from './balances.component';
import { ExchangeService } from '../../service/exchange.service';
import { Currency } from '../../model/domain.model';
import { signal } from '@angular/core';


describe('BalancesComponent', () => {
  let component: BalancesComponent;
  let fixture: ComponentFixture<BalancesComponent>;
  let balanceServiceMock : jasmine.SpyObj<BalanceService> = jasmine.createSpyObj('BalanceService', [
    'getAllBalances', 'getBalancesByCurrencyExchange'
  ]);
  const exchangeServiceMock = jasmine.createSpyObj('ExchangeService', {
    currencyDefault : signal<Currency>(Currency.BRL),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalancesComponent],
      providers: [
        { provide: BalanceService, useValue: balanceServiceMock },
        { provide: QuoteService, useValue: jasmine.createSpyObj('QuoteService', ['getExchangeQuote']) },
        { provide: ExchangeService, useValue: exchangeServiceMock },
      ]
    })
    .compileComponents();

    balanceServiceMock.getAllBalances.and.returnValue({});
    balanceServiceMock.getBalancesByCurrencyExchange.and.returnValue([
      {
        id: '1',
        accountName: 'Account 1',
        balance: { currency: Currency.BRL, value: 1000 },
        type: 'bank' as any,
        date: jasmine.any(Date) as any,
        exchange: { currency: Currency.BRL, value: 1000 } as any,
      },
      {
        id: '2',
        accountName: 'Account 2',
        balance: { currency: Currency.BRL, value: 2000 },
        type: 'bank' as any,
        date: jasmine.any(Date) as any,
        exchange: { currency: Currency.BRL, value: 2000 } as any,
      }
    ]);
    // exchangeServiceMock.enhanceExchangeInfo.and.returnValue({ value: 1000 });

    fixture = TestBed.createComponent(BalancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
