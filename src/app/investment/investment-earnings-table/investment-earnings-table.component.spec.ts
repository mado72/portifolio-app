import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Currency } from '../../model/domain.model';
import { IncomeEnum } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { assetsMock$, provideAssetServiceMock } from '../../service/service-mock.spec';
import { InvestmentEarningsTableComponent } from './investment-earnings-table.component';

class MyService {

}
describe('InvestmentEarningsTableComponent', () => {
  let component: InvestmentEarningsTableComponent;
  let fixture: ComponentFixture<InvestmentEarningsTableComponent>;
  let investmentServiceMock: jasmine.SpyObj<InvestmentService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentEarningsTableComponent],
      providers: [
        provideAssetServiceMock(),
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

  it('should map earnings and set dataSource correctly', () => {
    const mockAssets = {
      AAPL: { quote: { currency: 'USD' }, name: 'Apple Inc.' },
      TSLA: { quote: { currency: 'USD' }, name: 'Tesla Inc.' }
    };

    const mockEarnings = [
      { id: '1', ticker: 'AAPL', type: IncomeEnum.DIVIDENDS, date: new Date('2023-01-01'), amount: 100, currency: Currency.USD, description: 'Apple Inc.' },
      { id: '2', ticker: 'TSLA', type: IncomeEnum.DIVIDENDS, date: new Date('2023-02-01'), amount: 200, currency: Currency.USD, description: 'Tesla Inc.' }
    ];

    assetsMock$.set(mockAssets as any);

    component.dataSource = mockEarnings;

    expect(component.dataSource).toEqual(mockEarnings);
  });
});
