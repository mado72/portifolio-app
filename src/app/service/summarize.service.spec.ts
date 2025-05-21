import { TestBed } from '@angular/core/testing';

import { SummarizeService } from './summarize.service';
import { Currency } from '../model/domain.model';
import { ExchangeService } from './exchange.service';

describe('SummarizeService', () => {
  let service: SummarizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExchangeService,
          useValue: {
            currencyDefault: () => Currency.USD,
            exchange: (value: number, fromCurrency: Currency, toCurrency: Currency) => ({
              value: value * 1 // Mock exchange rate
            })
          }
        }
      ]
    });
    service = TestBed.inject(SummarizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should summarize classes correctly', () => {
    const items = [
      { classify: 'A', value: 10 },
      { classify: 'B', value: 5 },
      { classify: 'A', value: 15 },
      { classify: 'C', value: 7 },
      { classify: 'B', value: 3 }
    ];
    const result = service.summarizeClass(items);
    expect(result).toEqual([
      { classify: 'A', value: 25 },
      { classify: 'B', value: 8 },
      { classify: 'C', value: 7 }
    ]);
  });

  it('should return empty array when summarizeClass is called with empty array', () => {
    expect(service.summarizeClass([])).toEqual([]);
  });

  it('should summarize classes by month correctly', () => {
    const items = [
      { classify: 'A', currency: Currency.USD, values: [1, 2, 3] },
      { classify: 'B', currency: Currency.USD, values: [4, 5, 6] },
      { classify: 'A', currency: Currency.USD, values: [7, 8, 9] }
    ];
    // Only the first occurrence of each classify is used for the month
    // So for month 1: A: 10, B: 5
    const result = service.summarizeClassMonth(items, 1);
    expect(result).toEqual([
      { classify: 'A', value: 10 },
      { classify: 'B', value: 5 }
    ]);
  });

  it('should return empty array when summarizeClassMonth is called with empty array', () => {
    expect(service.summarizeClassMonth([], 1)).toEqual([]);
  });

  it('should ignore items with missing classify in summarizeClass', () => {
    const items = [{ value: 10 }, { classify: 'A', value: 5 }];
    const result = service.summarizeClass(items as any);
    expect(result).toEqual([{ classify: 'A', value: 5 }]);
  });

  it('should handle negative and zero values in summarizeClass', () => {
    const items = [
      { classify: 'A', value: 0 },
      { classify: 'A', value: -5 },
      { classify: 'B', value: 10 }
    ];
    const result = service.summarizeClass(items);
    expect(result).toEqual([
      { classify: 'A', value: -5 },
      { classify: 'B', value: 10 }
    ]);
  });

  it('should summarize classes by year correctly', () => {
    const items = [
      { classify: 'A', currency: Currency.USD, values: [1, 2, 3] },
      { classify: 'B', currency: Currency.USD, values: [4, 5, 6] },
      { classify: 'A', currency: Currency.USD, values: [7, 8, 9] }
    ];
    // A: (1+2+3) + (7+8+9) = 30, B: 4+5+6 = 15
    const result = service.summarizeClassYear(items);
    expect(result).toEqual([
      { classify: 'A', value: 30 },
      { classify: 'B', value: 15 }
    ]);
  });

  it('should return empty array when summarizeClassYear is called with empty array', () => {
    expect(service.summarizeClassYear([])).toEqual([]);
  });

  it('should compute growth rate correctly with lastValue provided', () => {
    const items = [120, 60, 120];
    // lastValue = 100
    // A: ((120-100)/100)*100 = 20
    // B: ((60-120)/120)*100 = -50
    // C: ((120-60)/60)*100 = 100
    const result = service.computeGrowthRate(100, Currency.USD, items);
    expect(result).toEqual([20, -50, 100]);
  });

  it('should compute growth rate with lastValue 0 for first item', () => {
    const items = [0, 100];
    // first: index 0, lastValue 0 => 0
    // second: ((100-0)/0)*100 => Infinity, but in code lastValue is set to previous growthRate (0), so ((100-0)/0)*100 = Infinity
    // But since lastValue is set to previous growthRate, which is 0, so result is [0, NaN]
    const result = service.computeGrowthRate(0, Currency.USD, items);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(Infinity);
  });

  it('should compute growth rate with negative values', () => {
    const items = [-100, -50, 0];
    // lastValue = 100
    // A: ((-100-100)/100)*100 = -200
    // B: ((-50--100)/-100)*100 = (-50+100)/-100*100 = 50/-100*100 = -50
    // C: ((0--50)/-50)*100 = (50/-50)*100 = -100
    const result = service.computeGrowthRate(100, Currency.USD, items);
    expect(result).toEqual([-200, -50, -100]);
  });

  it('should compute growth rate with all zeros', () => {
    const items = [0, 0];
    // lastValue = 0
    // A: index 0, lastValue 0 => 0
    // B: lastValue = previous growthRate (0), ((0-0)/0)*100 = NaN
    const result = service.computeGrowthRate(0, Currency.USD, items);
    expect(result[0]).toBe(0);
    expect(result[1]).toBeNaN();
  });

  it('should handle empty array in computeGrowthRate', () => {
    expect(service.computeGrowthRate(100, Currency.USD, [])).toEqual([]);
  });

  it('should handle single item in computeGrowthRate', () => {
    const items = [50];
    // ((50-100)/100)*100 = -50
    const result = service.computeGrowthRate(100, Currency.USD, items);
    expect(result).toEqual([-50]);
  });

  it('should summarize year values correctly', () => {
    const items = [
      { classify: 'A', currency: Currency.USD, values: [1, 2, 3] },
      { classify: 'B', currency: Currency.USD, values: [4, 5, 6] },
      { classify: 'C', currency: Currency.USD, values: [7, 8, 9] }
    ];
    // [1+4+7, 2+5+8, 3+6+9] = [12, 15, 18]
    const result = service.summarizeMatrix(items);
    expect(result).toEqual([12, 15, 18]);
  });

  it('should handle empty array in summarizeYear', () => {
    expect(service.summarizeMatrix([])).toEqual([]);
  });

  it('should handle items with different length values arrays', () => {
    const items = [
      { classify: 'A', currency: Currency.USD, values: [1, 2] },
      { classify: 'B', currency: Currency.USD, values: [3, 4, 5] }
    ];
    // [1+3, 2+4, 0+5] = [4, 6, 5]
    const result = service.summarizeMatrix(items);
    expect(result).toEqual([4, 6, 5]);
  });

  it('should handle negative and zero values in summarizeYear', () => {
    const items = [
      { classify: 'A', currency: Currency.USD, values: [0, -2, 3] },
      { classify: 'B', currency: Currency.USD, values: [-1, 2, 0] }
    ];
    // [0+(-1), -2+2, 3+0] = [-1, 0, 3]
    const result = service.summarizeMatrix(items);
    expect(result).toEqual([-1, 0, 3]);
  });

  it('should handle single item in summarizeYear', () => {
    const items = [
      { classify: 'A', currency: Currency.USD, values: [10, 20, 30] }
    ];
    const result = service.summarizeMatrix(items);
    expect(result).toEqual([10, 20, 30]);
  });

  it('should compute variation correctly', () => {
    // lastValue = 100
    // values = [120, 130, 110]
    // incomes = [10, 20, 10]
    // withdrawals = [5, 10, 5]
    // contributions = [15, 10, 5]
    // For index 0: lastValue=100, index=0, lastValue==0 is false, so
    // variation = 120 - (100 + 15 - 10 - 5) = 20
    // For index 1: lastValue=120, variation = 30
    // For index 2: lastValue=130, variation = -10
    const lastValue = 100;
    const values = [120, 130, 110];
    const incomes = [10, 20, 10];
    const withdrawals = [5, 10, 5];
    const contributions = [15, 10, 5];
    const result = service.computeVariation(lastValue, Currency.USD, values, incomes, withdrawals, contributions);
    expect(result).toEqual([20, 30, -10]);
  });

  it('should compute variation with lastValue 0 for first item', () => {
    const lastValue = 0;
    const values = [50, 60];
    const incomes = [0, 0];
    const withdrawals = [0, 0];
    const contributions = [0, 0];
    const result = service.computeVariation(lastValue, Currency.USD, values, incomes, withdrawals, contributions);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(10);
  });

  it('should compute variation with negative and zero values', () => {
    const lastValue = 0;
    const values = [0, -10, 10];
    const incomes = [0, 0, 0];
    const withdrawals = [0, 0, 0];
    const contributions = [0, 0, 0];
    const result = service.computeVariation(lastValue, Currency.USD, values, incomes, withdrawals, contributions);
    expect(result).toEqual([0, -10, 20]);
  });

  it('should handle empty array in computeVariation', () => {
    expect(service.computeVariation(100, Currency.USD, [], [], [], [])).toEqual([]);
  });

  it('should compute variation rate correctly', () => {
    // lastValue = 100
    // variantions = [120, 60, 180]
    // incomes = [10, 20, 30]
    // For index 0: lastValue=100, index=0, lastValue==0 is false, so
    // growthRate = (120 / (100+10)) * 100 = (120/110)*100 = 109.09
    // For index 1: lastValue=120, growthRate = (60/(120+20))*100 = (60/140)*100 = 42.86
    // For index 2: lastValue=60, growthRate = (180/(60+30))*100 = (180/90)*100 = 200.00
    const lastValue = 100;
    const variations = [120, 60, 180];
    const incomes = [10, 20, 30];
    const result = service.computeVariationRate(lastValue, Currency.USD, variations, incomes);
    expect(result).toEqual([109.09, 42.86, 200.00]);
  });

  it('should compute variation rate with lastValue 0 for first item', () => {
    const lastValue = 0;
    const variations = [50, 100];
    const incomes = [0, 0];
    const result = service.computeVariationRate(lastValue, Currency.USD, variations, incomes);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(200);
  });

  it('should compute variation rate with negative and zero values', () => {
    const lastValue = 0;
    const variations = [0, -10, 10];
    const incomes = [0, 0, 0];
    const result = service.computeVariationRate(lastValue, Currency.USD, variations, incomes);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(-Infinity);
    expect(result[2]).toBe(-100);
  });

  it('should handle empty array in computeVariationRate', () => {
    expect(service.computeVariationRate(100, Currency.USD, [], [])).toEqual([]);
  });

  it('should compute variation accumulated correctly', () => {
    // variationsRate = [0.1, 0.2, -0.05]
    // index 0: value=0.1, index=0, value!==0, so accumulated = (1+0.1)*(1+0)-1 = 1.1*1-1=0.1
    // index 1: (1+0.2)*(1+0.1)-1 = 1.2*1.1-1=1.32-1=0.32
    // index 2: (1-0.05)*(1+0.2)-1 = 0.95*1.2-1=1.14-1=0.14
    const variationsRate = [0.1, 0.2, -0.05];
    const result = service.computeVariationAccumulated(variationsRate);
    expect(result[0]).toBeCloseTo(0.1, 4);
    expect(result[1]).toBeCloseTo(0.32, 4);
    expect(result[2]).toBeCloseTo(0.14, 4);
  });

  it('should handle zero as first value in computeVariationAccumulated', () => {
    const variationsRate = [0, 0.1, 0.2];
    const result = service.computeVariationAccumulated(variationsRate);
    expect(result[0]).toBe(0);
    expect(result[1]).toBeCloseTo(0.1, 4);
    expect(result[2]).toBeCloseTo(0.32, 4);
  });

  it('should handle empty array in computeVariationAccumulated', () => {
    expect(service.computeVariationAccumulated([])).toEqual([]);
  });

  it('should handle single value in computeVariationAccumulated', () => {
    expect(service.computeVariationAccumulated([0.05])).toEqual([0.05]);
  });

  it('should compute yield rate correctly', () => {
    // values = [10, 20, 30], incomes = [2, 4, 6]
    // yieldRate = (value/income)*100, rounded
    // [500, 500, 500]
    const values = [10, 20, 30];
    const incomes = [2, 4, 6];
    const result = service.yieldRate(values, incomes);
    expect(result).toEqual([500, 500, 500]);
  });

  it('should return 0 for first item if income is 0 in yieldRate', () => {
    const values = [0, 10];
    const incomes = [0, 5];
    const result = service.yieldRate(values, incomes);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(200);
  });

  it('should handle zero and negative incomes in yieldRate', () => {
    const values = [10, -10, 0];
    const incomes = [2, -2, 0];
    const result = service.yieldRate(values, incomes);
    expect(result[0]).toBe(500);
    expect(result[1]).toBe(500);
    expect(result[2]).toBe(0);
  });

  it('should handle empty array in yieldRate', () => {
    expect(service.yieldRate([], [])).toEqual([]);
  });

  it('should handle single value in yieldRate', () => {
    expect(service.yieldRate([10], [2])).toEqual([500]);
  });

});
