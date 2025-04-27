import { TestBed } from '@angular/core/testing';

import { ChartResultArray, YahooRemoteQuotesService } from './yahoo-remote-quotes.service';
import { HttpParams, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { Ticker } from '../model/source.model';
import { endOfDay } from 'date-fns';


describe('YahooRemoteQuotesService', () => {
  let service: YahooRemoteQuotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(YahooRemoteQuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getHistorical with correct parameters and return data', () => {
    const mockResponse: Record<string, any> = {
      'AAPL': {
        meta: {
          currency: 'USD',
          symbol: 'AAPL',
          exchangeName: 'NMS',
          instrumentType: 'EQUITY',
          regularMarketPrice: 150,
          regularMarketTime: new Date(),
          gmtoffset: -18000,
          timezone: 'EST',
          exchangeTimezoneName: 'America/New_York',
          priceHint: 2,
          currentTradingPeriod: {
            pre: { timezone: 'EST', start: new Date(), end: new Date(), gmtoffset: -18000 },
            regular: { timezone: 'EST', start: new Date(), end: new Date(), gmtoffset: -18000 },
            post: { timezone: 'EST', start: new Date(), end: new Date(), gmtoffset: -18000 }
          },
          dataGranularity: '1d',
          range: '1mo',
          validRanges: ['1d', '5d', '1mo']
        },
        quotes: [
          { high: 150, low: 145, open: 148, close: 149, volume: 1000000 }
        ]
      },
      'JPM': {
        meta: {
          currency: 'USD',
          symbol: 'AAPL',
          exchangeName: 'NMS',
          instrumentType: 'EQUITY',
          regularMarketPrice: 150,
          regularMarketTime: new Date(),
          gmtoffset: -18000,
          timezone: 'EST',
          exchangeTimezoneName: 'America/New_York',
          priceHint: 2,
          currentTradingPeriod: {
            pre: { timezone: 'EST', start: new Date(), end: new Date(), gmtoffset: -18000 },
            regular: { timezone: 'EST', start: new Date(), end: new Date(), gmtoffset: -18000 },
            post: { timezone: 'EST', start: new Date(), end: new Date(), gmtoffset: -18000 }
          },
          dataGranularity: '1d',
          range: '1mo',
          validRanges: ['1d', '5d', '1mo']
        },
        quotes: [
          { high: 150, low: 145, open: 148, close: 149, volume: 1000000 }
        ]
      }
    };

    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    const tickers: Ticker[] = ['AAPL', 'JPM'];

    const startDateStr = '2023-01-01';
    const endDateStr = '2023-01-31';
    const expectedUrl = `${environment.apiBaseUrl}/yahoo/historical/${startDateStr}/${endDateStr}`;
    const httpMock = TestBed.inject(HttpTestingController);
    
    service.getHistorical(tickers, startDate, endDate).subscribe((data) => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(request=> {
      return request.url.startsWith(expectedUrl) && request.params.get('ticker') === 'AAPL,JPM';
    })
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse);
    httpMock.verify();
  });
});
