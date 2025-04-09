import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledTransactionDialogComponent } from './scheduled-transaction-dialog.component';
import { BalanceService } from '../../service/balance.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

class MyService {
  getAllBalances = () => ([]);
}

const dataMock = {
  scheduled: {
    description: "",
    value : {
      amount: 0,
      currency: "BRL"
    },
    type: "EXPENSE",
    originAccountId: "CC-123",
    targetAccountId: undefined,
    category: "",
    scheduled: {
      type: "WEEKLY",
      startDate: new Date(),
      endDate: undefined
    }
  }
}

const dialogMock = {
  close: () => {}
};
describe('ScheduledTransactionDialogComponent', () => {
  let component: ScheduledTransactionDialogComponent;
  let fixture: ComponentFixture<ScheduledTransactionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduledTransactionDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogMock },
        { provide: MAT_DIALOG_DATA, useValue: dataMock },
        { provide: BalanceService, useClass: MyService },
      ]
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
