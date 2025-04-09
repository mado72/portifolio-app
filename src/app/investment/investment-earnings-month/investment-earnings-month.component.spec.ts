import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentEarningsMonthComponent } from './investment-earnings-month.component';
import { InvestmentService } from '../../service/investment.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

class MyService {
  findIncomesBetween = () => []
}
describe('InvestmentEarningsMonthComponent', () => {
  let component: InvestmentEarningsMonthComponent;
  let fixture: ComponentFixture<InvestmentEarningsMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentEarningsMonthComponent],
      providers: [
        { provide: InvestmentService, useClass: MyService },
        provideAnimationsAsync()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentEarningsMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
