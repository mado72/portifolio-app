import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialForecastComponent } from './financial-forecast.component';
import { BalanceService } from '../../service/balance.service';

class MyService {
  getCurrentMonthForecast = () => ([]);
}
describe('FinancialForecastComponent', () => {
  let component: FinancialForecastComponent;
  let fixture: ComponentFixture<FinancialForecastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialForecastComponent],
      providers: [
        {provide: BalanceService, useClass: MyService}
      ]
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
