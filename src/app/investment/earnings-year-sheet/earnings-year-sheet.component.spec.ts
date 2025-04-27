import { ComponentFixture, TestBed } from '@angular/core/testing';

import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { InvestmentService } from '../../service/investment.service';
import { provideAssetServiceMock, provideInvestmentServiceMock, providePortfolioServiceMock } from '../../service/service-mock.spec';
import { EarningsYearSheetComponent } from './earnings-year-sheet.component';

describe('EarningsYearSheetComponent', () => {
  let component: EarningsYearSheetComponent;
  let fixture: ComponentFixture<EarningsYearSheetComponent>;
  let investmentService: jasmine.SpyObj<InvestmentService>;
  let findIncomesBetweenResult = signal([]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarningsYearSheetComponent],
      providers: [
        provideAssetServiceMock(),
        providePortfolioServiceMock(),
        provideInvestmentServiceMock(),
        provideAnimationsAsync()
      ]
    })
    .compileComponents();

    investmentService = TestBed.inject(InvestmentService) as jasmine.SpyObj<InvestmentService>;
    investmentService.findIncomesBetween.and.returnValue(findIncomesBetweenResult());

    fixture = TestBed.createComponent(EarningsYearSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
