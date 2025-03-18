import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentEarningsTableComponent } from './investment-earnings-table.component';

describe('InvestmentEarningsTableComponent', () => {
  let component: InvestmentEarningsTableComponent;
  let fixture: ComponentFixture<InvestmentEarningsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentEarningsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentEarningsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
