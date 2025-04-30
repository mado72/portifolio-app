import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitabilityInvestmentComponent } from './profitability-investment.component';

describe('ProfitabilityInvestmentComponent', () => {
  let component: ProfitabilityInvestmentComponent;
  let fixture: ComponentFixture<ProfitabilityInvestmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitabilityInvestmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfitabilityInvestmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
