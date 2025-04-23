import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentEarningsTableComponent } from './investment-earnings-table.component';
import { InvestmentService } from '../../service/investment.service';
import { Income, IncomeEnum } from '../../model/investment.model';
import { AssetService } from '../../service/asset.service';

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

    const mockEarnings: Income[] = [
      { id: '1', ticker: 'AAPL', type: IncomeEnum.DIVIDENDS, date: new Date('2023-01-01'), amount: 100 },
      { id: '2', ticker: 'TSLA', type: IncomeEnum.DIVIDENDS, date: new Date('2023-02-01'), amount: 200 }
    ];

    const assetServiceMock = jasmine.createSpyObj('AssetService', ['assets']);
    assetServiceMock.assets.and.returnValue(mockAssets);

    TestBed.overrideProvider(AssetService, { useValue: assetServiceMock });

    component.dataSource = mockEarnings;

    expect(component.dataSource).toEqual(mockEarnings);

    expect(assetServiceMock.assets).toHaveBeenCalled();
  });
});
