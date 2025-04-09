import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsEntryDialogComponent } from './earnings-entry-dialog.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AssetEnum } from '../../model/source.model';
import { Currency } from '../../model/domain.model';
import { InvestmentService } from '../../service/investment.service';

class MyService {
  
}

const dataMock = {
  portfolio: '',
  ticker: '',
  asset: {
    marketPlace: 'TEST',
    code: "CODE000",
    ticker: '',
    initialPrice: 0,
    lastUpdate: new Date(),
    quote: {
      price: 0,
      currency: Currency.BRL
    },
    type: AssetEnum.OTHER,
    trend: "up"
  },
  quantity: 0,
  percent: 0,
}

const dialogMock = {
  close: () => {}
};

describe('EarningsEntryDialogComponent', () => {
  let component: EarningsEntryDialogComponent;
  let fixture: ComponentFixture<EarningsEntryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarningsEntryDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogMock },
        { provide: MAT_DIALOG_DATA, useValue: dataMock },
        { provide: InvestmentService, useClass: MyService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarningsEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
