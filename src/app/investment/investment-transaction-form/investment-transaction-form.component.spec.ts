import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentTransactionFormComponent } from './investment-transaction-form.component';

describe('InvestmentTransactionFormComponent', () => {
  let component: InvestmentTransactionFormComponent;
  let fixture: ComponentFixture<InvestmentTransactionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentTransactionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentTransactionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
