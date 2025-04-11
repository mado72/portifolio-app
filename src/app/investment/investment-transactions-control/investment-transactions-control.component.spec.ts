import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentTransactionsControlComponent } from './investment-transactions-control.component';

describe('InvestmentTransactionsControlComponent', () => {
  let component: InvestmentTransactionsControlComponent;
  let fixture: ComponentFixture<InvestmentTransactionsControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentTransactionsControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentTransactionsControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
