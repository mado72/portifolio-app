import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentEarningsDetailsComponent } from './investment-earnings-details.component';

describe('InvestmentEarningsDetailsComponent', () => {
  let component: InvestmentEarningsDetailsComponent;
  let fixture: ComponentFixture<InvestmentEarningsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentEarningsDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentEarningsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
