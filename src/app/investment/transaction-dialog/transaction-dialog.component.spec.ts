import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionDialogComponent } from './transaction-dialog.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InvestmentService } from '../../service/investment.service';
import { QuoteService } from '../../service/quote.service';

class MyService {
  quotes = () => ({});
}

const dataMock = {
  transaction: {
    id: '131233',
    ticker: 'XX:0001' ,
    date: new Date(), 
    accountId: '12312321' ,
    quantity: 0, 
    quote: 0,
    value: {
      price: 0, 
      currency: "BRL", 
    },
    type: "EXPENSE", 
    status: "COMPLETED", 
    brokerage: undefined 
  }
}

const dialogMock = {
  close: () => {}
};
describe('TransactionDialogComponent', () => {
  let component: TransactionDialogComponent;
  let fixture: ComponentFixture<TransactionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogMock },
        { provide: MAT_DIALOG_DATA, useValue: dataMock },
        { provide: InvestmentService, useClass: MyService },
        { provide: QuoteService, useClass: MyService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
