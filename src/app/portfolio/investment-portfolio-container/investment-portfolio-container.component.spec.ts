import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentPortfolioContainerComponent } from './investment-portfolio-container.component';

describe('InvestmentPortfolioContainerComponent', () => {
  let component: InvestmentPortfolioContainerComponent;
  let fixture: ComponentFixture<InvestmentPortfolioContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentPortfolioContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentPortfolioContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
