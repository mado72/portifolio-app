import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionTableFilterComponent } from './transaction-table-filter.component';

describe('TransactionTableFilterComponent', () => {
  let component: TransactionTableFilterComponent;
  let fixture: ComponentFixture<TransactionTableFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionTableFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionTableFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
