import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentTransactionFormComponent } from './investment-transaction-form.component';
import { SourceService } from '../../service/source.service';
import { QuoteService } from '../../service/quote.service';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

class MyService {
  getAllBalances () {}
  getAccounts = () => []
  getAllPortfolios = () => []
}
describe('InvestmentTransactionFormComponent', () => {
  let component: InvestmentTransactionFormComponent;
  let fixture: ComponentFixture<InvestmentTransactionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentTransactionFormComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: PortfolioService, useClass: MyService },
        { provide: SourceService, useClass: MyService },
        { provide: QuoteService, useClass: MyService },
        { provide: BalanceService, useClass: MyService },
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
