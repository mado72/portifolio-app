import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceDialogComponent } from './balance-dialog.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AccountTypeEnum, Currency } from '../../model/domain.model';

const dataMock = {
  account : {
    id: 'mk312km3',
    accountName: '12131321',
    type: AccountTypeEnum.CHECKING,
    balance: {
      currency: Currency.BRL,
      price: 0
    }
  }
}

const dialogMock = {
  close: () => {}
};

describe('BalanceDialogComponent', () => {
  let component: BalanceDialogComponent;
  let fixture: ComponentFixture<BalanceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogMock },
        { provide: MAT_DIALOG_DATA, useValue: dataMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
