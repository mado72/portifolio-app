import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioAllocationDialogComponent } from './portfolio-allocation-dialog.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Currency } from '../../model/domain.model';
import { AssetEnum } from '../../model/source.model';

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
      value: 0,
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

describe('PortfolioAllocationDialogComponent', () => {
  let component: PortfolioAllocationDialogComponent;
  let fixture: ComponentFixture<PortfolioAllocationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PortfolioAllocationDialogComponent
      ],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogMock },
        { provide: MAT_DIALOG_DATA, useValue: dataMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioAllocationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should print ok', ()=> {
    expect(1).not.toBe(0);
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
