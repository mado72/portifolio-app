import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurrenceTransactionDialogComponent } from './recurrence-transaction-dialog.component';

describe('RecurrenceTransactionDialogComponent', () => {
  let component: RecurrenceTransactionDialogComponent;
  let fixture: ComponentFixture<RecurrenceTransactionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurrenceTransactionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecurrenceTransactionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
