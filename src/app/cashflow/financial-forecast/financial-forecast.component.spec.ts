import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceService } from '../../service/balance.service';
import { provideExchangeServiceMock } from '../../service/service-mock.spec';
import { FinancialForecastComponent } from './financial-forecast.component';

class MyService {
  getCurrentMonthForecast = () => ([]);
  getForecastSummary = () => [];
  addTransaction = ()=> {}
  updateTransaction = () => {}
  getAllBalances = () => []
  getBalancesSummarized = () => 1
}
describe('FinancialForecastComponent', () => {
  let component: FinancialForecastComponent;
  let fixture: ComponentFixture<FinancialForecastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialForecastComponent],
      providers: [
        provideExchangeServiceMock(),
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
