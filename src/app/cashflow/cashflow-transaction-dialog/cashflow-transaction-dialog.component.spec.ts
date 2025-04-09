import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashflowTransactionDialogComponent } from './cashflow-transaction-dialog.component';

describe('CashflowTransactionDialogComponent', () => {
  let component: CashflowTransactionDialogComponent;
  let fixture: ComponentFixture<CashflowTransactionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashflowTransactionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashflowTransactionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
