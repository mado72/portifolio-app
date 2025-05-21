import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitabilityComponent } from './profitability.component';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { ClassifyService } from '../../service/classify.service';
import { BaseChartDirective } from 'ng2-charts';
import { ExchangeService } from '../../service/exchange.service';
import { FinancialGridComponent } from '../../utils/component/financial-grid/financial-grid.component';

describe('ProfitabilityComponent', () => {
  let component: ProfitabilityComponent;
  let fixture: ComponentFixture<ProfitabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitabilityComponent],
      providers: [
        {
          provide: ProfitabilityService,
          useValue: {
            selectedYear: () => 2023,
            profitabilityTotal: () => ({
              values: [100, 200, 300],
              labels: ['Jan', 'Feb', 'Mar']
            }),
            profitabilitySource: () => ({
              2023: {
                'classify1': [100, 200, 300],
                'classify2': [400, 500, 600]
              }
            }),
            accumulatedValues: () => ({
              classify1: [1000, 2000, 3000],
              classify2: [4000, 5000, 6000]
            })
          }
        },
        {
          provide: ClassifyService,
          useValue: {
            classifiersMap: () => ({
              'classify1': { name: 'Classify 1' },
              'classify2': { name: 'Classify 2' }
            })
          }
        },
        {
          provide: ExchangeService,
          useValue: {
            currencyDefault: () => 'USD',
            exchange: (value: number, fromCurrency: string, toCurrency: string) => ({
              value: value * 1.2 // Mock exchange rate
            })
          }
        },
        {
          provide: ProfitabilityService,
          useValue: {
            selectedYear: () => 2023,
            profitabilityTotal: () => ({
              values: [100, 200, 300],
              labels: ['Jan', 'Feb', 'Mar']
            }),
            profitabilitySource: () => ({
              2023: {
                'classify1': [100, 200, 300],
                'classify2': [400, 500, 600]
              }
            }),
            aggregatedTransactionsRows: () => [
              { date: '2023-01-01', amount: 100 },
              { date: '2023-02-01', amount: 200 }
            ],
            profitabilityRowsData: () => ({
              'classify1': { date: '2023-01-01', amount: 100 },
              'classify2': { date: '2023-02-01', amount: 200 }
            }),
            months: () => ['Jan', 'Feb', 'Mar'],
            equityContributionRows: () => [
              { date: '2023-01-01', amount: 100 },
              { date: '2023-02-01', amount: 200 }
            ],
            growthRateValues: () => [10, 20, 30],
            varianceValues: () => [1, 2, 3],
            varianceRateValues: () => [0.1, 0.2, 0.3],
            accumulatedValues: () => [1000, 2000, 3000],
            yieldValues: () => [5, 10, 15]
          }
        },
        {
          provide: BaseChartDirective,
          useValue: {
            update: () => {},
          }
        }
      ]
    })
    .overrideComponent(FinancialGridComponent, {
      set: {
        selector: 'app-financial-grid',
        template: '<div></div>',
        changeDetection: 0,
        inputs: ['data', 'cellChanged']
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfitabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
