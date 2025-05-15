import { TestBed } from '@angular/core/testing';

import { SummarizeService } from './summarize.service';

describe('SummarizeService', () => {
  let service: SummarizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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
      { classify: 'A', values: [1, 2, 3], month: 1 },
      { classify: 'B', values: [4, 5, 6], month: 1 },
      { classify: 'A', values: [7, 8, 9], month: 1 }
    ];
    // Only the first occurrence of each classify is used for the month
    // So for month 1: A: 2, B: 5
    const result = service.summarizeClassMonth(items);
    expect(result).toEqual([
      { classify: 'A', value: 2 },
      { classify: 'B', value: 5 }
    ]);
  });

  it('should return empty array when summarizeClassMonth is called with empty array', () => {
    expect(service.summarizeClassMonth([])).toEqual([]);
  });

  it('should handle summarizeClassMonth with different months', () => {
    const items = [
      { classify: 'A', values: [1, 2, 3], month: 2 },
      { classify: 'B', values: [4, 5, 6], month: 0 }
    ];
    // A: values[2] = 3, B: values[0] = 4
    const result = service.summarizeClassMonth(items);
    expect(result).toEqual([
      { classify: 'A', value: 3 },
      { classify: 'B', value: 4 }
    ]);
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

});
