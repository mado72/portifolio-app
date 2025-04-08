import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurrenceTransactionListComponent } from './recurrence-transaction-list.component';

describe('RecurrenceTransactionListComponent', () => {
  let component: RecurrenceTransactionListComponent;
  let fixture: ComponentFixture<RecurrenceTransactionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurrenceTransactionListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecurrenceTransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
