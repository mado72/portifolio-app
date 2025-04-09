import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { getScheduleDates } from './model/functions.model';
import { Scheduled } from './model/domain.model';
import { differenceInDays, differenceInMonths, getDate, getDay, getDayOfYear } from 'date-fns';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'portifolio-app' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('portifolio-app');
  });

  // it('should render title', () => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.nativeElement as HTMLElement;
  //   expect(compiled.querySelector('h1')?.textContent).toContain('Hello, portifolio-app');
  // });
  fdescribe('getScheduleDates', () => {
    const scheduledRange = { start: new Date(2023, 0, 3), end: new Date(2023, 11, 28) };
    const dateRange = { start: new Date(2023, 2, 1), end: new Date(2023, 8, 31) };

    it('should generate daily dates within the date range for Scheduled.DIARY', () => {
      const result = getScheduleDates(scheduledRange, dateRange, Scheduled.DIARY);
      expect(result.every(date => date >= dateRange.start && date <= dateRange.end)).toBeTrue();
    });
  
    it('should generate weekly dates within the date range for Scheduled.WEEKLY', () => {
      const result = getScheduleDates(scheduledRange, dateRange, Scheduled.WEEKLY);
      expect(result.every(date => date >= dateRange.start && date <= dateRange.end)).toBeTrue();
      for (var i = 1; i < result.length; i++) {
        const last = getDay(result[i-1]);
        const date = getDay(result[i]);
        expect(date).toBe(last);
        expect(differenceInDays(result[i], result[i-1])).toBe(7);
      }
    });
    
    it('should generate quarterly dates within the date range for Scheduled.FORTNIGHTLY', () => {
      const result = getScheduleDates(scheduledRange, dateRange, Scheduled.FORTNIGHTLY);
      expect(result.every(date => date >= dateRange.start && date <= dateRange.end)).toBeTrue();
      for (var i = 1; i < result.length; i++) {
        const last = getDay(result[i-1]);
        const date = getDay(result[i]);
        expect(date).toBe(last);
        expect(differenceInDays(result[i], result[i - 1])).toBe(14);
      }
    });
  
    it('should generate monthly dates within the date range for Scheduled.MONTHLY', () => {
      const result = getScheduleDates(scheduledRange, dateRange, Scheduled.MONTHLY);
      expect(result.every(date => date >= dateRange.start && date <= dateRange.end)).toBeTrue();
      for (var i = 1; i < result.length; i++) {
        const last = getDate(result[i-1]);
        const date = getDate(result[i]);
        expect(date).toBe(last);
        expect(differenceInMonths(result[i], result[i-1])).toBe(1);
      }
    });
    
    it('should generate quarterly dates within the date range for Scheduled.QUARTER', () => {
      const result = getScheduleDates(scheduledRange, dateRange, Scheduled.QUARTER);
      expect(result.every(date => date >= dateRange.start && date <= dateRange.end)).toBeTrue();
      for (var i = 1; i < result.length; i++) {
        const last = getDate(result[i-1]);
        const date = getDate(result[i]);
        expect(date).toBe(last);
        expect(differenceInMonths(result[i], result[i - 1])).toBe(3);
      }
    });
  
    it('should generate yearly dates within the date range for Scheduled.HALF_YEARLY', () => {
      const dateRange = { start: new Date(2023, 0, 1), end: new Date(2023, 11, 31) };
      const result = getScheduleDates(scheduledRange, dateRange, Scheduled.HALF_YEARLY);
      expect(result.every(date => date >= dateRange.start && date <= dateRange.end)).toBeTrue();
      expect(result.length).toBe(2);
      for (var i = 1; i < result.length; i++) {
        const last = getDate(result[i-1]);
        const date = getDate(result[i]);
        expect(date).toBe(last);
        const diff = differenceInMonths(result[i], result[i - 1]);
        expect(diff).toBe(6);
      }
    });
  
    it('should generate yearly dates within the date range for Scheduled.YEARLY', () => {
      const dateRange = { start: new Date(2023, 0, 1), end: new Date(2023, 11, 31) };
      const result = getScheduleDates(scheduledRange, dateRange, Scheduled.YEARLY);
      expect(result.every(date => date >= dateRange.start && date <= dateRange.end)).toBeTrue();
      expect(result.length).toBe(1);
    });
  
    it('should return the start date if schedule type is not recognized', () => {
      const result = getScheduleDates(scheduledRange, dateRange, "" as Scheduled);
      expect(result).toEqual([]);
    });
  });
});
