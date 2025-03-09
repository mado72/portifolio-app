import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialForecastComponent } from './financial-forecast.component';

describe('FinancialForecastComponent', () => {
  let component: FinancialForecastComponent;
  let fixture: ComponentFixture<FinancialForecastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialForecastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialForecastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
