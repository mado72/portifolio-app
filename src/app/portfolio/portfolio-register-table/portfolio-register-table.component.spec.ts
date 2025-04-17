import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioRegisterTableComponent } from './portfolio-register-table.component';
import { PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';

class MyService {
  portfolioAllocation = () => ([]);
  total = () => ({});
  enhanceExchangeInfo = () => ({})
  exchangeView = () => "original"
}

describe('PortfolioRegisterTableComponent', () => {
  let component: PortfolioRegisterTableComponent;
  let fixture: ComponentFixture<PortfolioRegisterTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioRegisterTableComponent],
      providers: [
        { provide: PortfolioService, useClass: MyService },
        { provide: QuoteService, useClass: MyService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioRegisterTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
