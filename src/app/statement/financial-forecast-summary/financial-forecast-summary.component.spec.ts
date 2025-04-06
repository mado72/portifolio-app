import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialForecastSummaryComponent } from './financial-forecast-summary.component';

describe('FinancialForecastSummaryComponent', () => {
  let component: FinancialForecastSummaryComponent;
  let fixture: ComponentFixture<FinancialForecastSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialForecastSummaryComponent]
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
