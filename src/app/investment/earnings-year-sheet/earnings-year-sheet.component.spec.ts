import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsYearSheetComponent } from './earnings-year-sheet.component';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

class MyService {
  assertsSignal = () => ({});
  findIncomesBetween = () => ([]);
  portfolios = () => ({});
}
describe('EarningsYearSheetComponent', () => {
  let component: EarningsYearSheetComponent;
  let fixture: ComponentFixture<EarningsYearSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarningsYearSheetComponent],
      providers: [
        {provide: InvestmentService, useClass: MyService },
        {provide: PortfolioService, useClass: MyService },
        provideAnimationsAsync()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarningsYearSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
