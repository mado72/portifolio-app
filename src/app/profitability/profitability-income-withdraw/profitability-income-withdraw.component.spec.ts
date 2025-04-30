import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitabilityIncomeWithdrawComponent } from './profitability-income-withdraw.component';

describe('ProfitabilityIncomeWithdrawComponent', () => {
  let component: ProfitabilityIncomeWithdrawComponent;
  let fixture: ComponentFixture<ProfitabilityIncomeWithdrawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitabilityIncomeWithdrawComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfitabilityIncomeWithdrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
