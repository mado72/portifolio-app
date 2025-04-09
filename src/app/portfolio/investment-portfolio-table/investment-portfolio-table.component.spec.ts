import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentPortfolioTableComponent } from './investment-portfolio-table.component';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';

class MyService {

  portfolios = ()=>({});
}
describe('InvestmentPortfolioTableComponent', () => {
  let component: InvestmentPortfolioTableComponent;
  let fixture: ComponentFixture<InvestmentPortfolioTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentPortfolioTableComponent],
      providers: [
        {provide: InvestmentService, useClass: MyService },
        {provide: PortfolioService, useClass: MyService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentPortfolioTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
