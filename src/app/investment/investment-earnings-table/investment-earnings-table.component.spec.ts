import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentEarningsTableComponent } from './investment-earnings-table.component';
import { InvestmentService } from '../../service/investment.service';

class MyService {

}
describe('InvestmentEarningsTableComponent', () => {
  let component: InvestmentEarningsTableComponent;
  let fixture: ComponentFixture<InvestmentEarningsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentEarningsTableComponent],
      providers: [
        { provide: InvestmentService, useClass: MyService}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentEarningsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
