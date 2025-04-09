import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioComponent } from './portfolio.component';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

class MyService {
  getAllocationSummary = () => ([]);
  getBalancesByCurrencyExchange = () => ([]);
  portfolioAllocation = () => ([]);
  getBalancesSummarized = () => 0;
  getForecastSummary = () => ([]);

  total = () => ({});

}
describe('PortfolioComponent', () => {
  let component: PortfolioComponent;
  let fixture: ComponentFixture<PortfolioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioComponent],
      providers: [
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
});
