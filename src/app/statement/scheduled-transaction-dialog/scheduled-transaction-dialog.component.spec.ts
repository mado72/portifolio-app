import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledTransactionDialogComponent } from './scheduled-transaction-dialog.component';

describe('ScheduledTransactionDialogComponent', () => {
  let component: ScheduledTransactionDialogComponent;
  let fixture: ComponentFixture<ScheduledTransactionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduledTransactionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduledTransactionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
