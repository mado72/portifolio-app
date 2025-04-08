import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementTransactionDialogComponent } from './statement-transaction-dialog.component';

describe('StatementTransactionDialogComponent', () => {
  let component: StatementTransactionDialogComponent;
  let fixture: ComponentFixture<StatementTransactionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatementTransactionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatementTransactionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
