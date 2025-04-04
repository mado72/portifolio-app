import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentPortfolioTableComponent } from './investment-portfolio-table.component';

describe('InvestmentPortfolioTableComponent', () => {
  let component: InvestmentPortfolioTableComponent;
  let fixture: ComponentFixture<InvestmentPortfolioTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentPortfolioTableComponent]
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
