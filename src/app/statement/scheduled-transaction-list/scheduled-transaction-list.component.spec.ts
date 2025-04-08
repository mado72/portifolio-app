import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledTransactionListComponent } from './scheduled-transaction-list.component';

describe('ScheduledTransactionListComponent', () => {
  let component: ScheduledTransactionListComponent;
  let fixture: ComponentFixture<ScheduledTransactionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduledTransactionListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduledTransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
