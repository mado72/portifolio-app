import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionTableComponent } from './transaction-table.component';
import { TransactionService } from '../../service/transaction.service';
import { BalanceService } from '../../service/balance.service';
import { ChangeDetectorRef } from '@angular/core';

class MyService {
  transactionSignal = () => [];
  investmentTransactions = () => []
}

describe('TransactionTableComponent', () => {
  let component: TransactionTableComponent;
  let fixture: ComponentFixture<TransactionTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionTableComponent],
      providers: [
        { provide: TransactionService, useClass: MyService},
        { provide: BalanceService, useClass: MyService},
        { provide: ChangeDetectorRef, useClass: MyService},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
