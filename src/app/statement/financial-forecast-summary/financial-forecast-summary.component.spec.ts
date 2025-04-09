import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialForecastSummaryComponent } from './financial-forecast-summary.component';
import { BalanceService } from '../../service/balance.service';
import { DecimalPipe } from '@angular/common';

class MyService{
  getBalancesSummarized = () => 0;
  getForecastSummary = () => ([]);
}

describe('FinancialForecastSummaryComponent', () => {
  let component: FinancialForecastSummaryComponent;
  let fixture: ComponentFixture<FinancialForecastSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialForecastSummaryComponent],
      providers: [
        { provide: BalanceService, useClass: MyService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialForecastSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
