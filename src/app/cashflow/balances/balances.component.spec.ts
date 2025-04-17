import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalancesComponent } from './balances.component';
import { BalanceService } from '../../service/balance.service';
import { QuoteService } from '../../service/quote.service';
import { SourceService } from '../../service/source.service';
import { Currency } from '../../model/domain.model';

class MyService {
  getBalancesByCurrencyExchange = () => ([]);
  getAllBalances = () => ([]);
  currencyDefault = () => (Currency.BRL);
}

describe('BalancesComponent', () => {
  let component: BalancesComponent;
  let fixture: ComponentFixture<BalancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalancesComponent],
      providers: [
        { provide: SourceService, useClass: MyService },
        { provide: QuoteService, useClass: MyService },
        { provide: BalanceService, useClass: MyService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
