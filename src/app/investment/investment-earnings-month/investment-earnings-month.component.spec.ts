import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentEarningsMonthComponent } from './investment-earnings-month.component';

describe('InvestmentEarningsMonthComponent', () => {
  let component: InvestmentEarningsMonthComponent;
  let fixture: ComponentFixture<InvestmentEarningsMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentEarningsMonthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentEarningsMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
