import { TestBed } from '@angular/core/testing';

import { ExchangeService } from './exchange.service';
import { Currency, CurrencyType } from '../model/domain.model';
import { SourceService } from './source.service';
import { RemoteQuotesService } from './remote-quotes.service';

describe('ExchangeService', () => {
  let service: ExchangeService;

  let remoteQuotesServiceMock: jasmine.SpyObj<RemoteQuotesService>;

  beforeEach(() => {
    remoteQuotesServiceMock = jasmine.createSpyObj('RemoteQuotesService', [
      'exchanges'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: RemoteQuotesService, use: remoteQuotesServiceMock },
      ]
    });
    
    service = TestBed.inject(ExchangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle exchangeView between "original" and "exchanged"', () => {
    expect(service.exchangeView()).toBe('original');
    service.toggleExchangeView();
    expect(service.exchangeView()).toBe('exchanged');
    service.toggleExchangeView();
    expect(service.exchangeView()).toBe('original');
  });


  it('should return the correct exchange quote', () => {
    const exchanges = {
      USD: { EUR: 0.85 },
      EUR: { USD: 1.18 }
    } as Record<CurrencyType, Record<CurrencyType, number>>;
    spyOn(service['remoteQuotesService'], 'exchanges').and.returnValue(exchanges);

    expect(service.getExchangeQuote(Currency.USD, Currency.EUR)).toBe(0.85);
    expect(service.getExchangeQuote(Currency.EUR, Currency.USD)).toBe(1.18);
    expect(service.getExchangeQuote(Currency.USD, 'GBP' as Currency)).toBeUndefined();
  });

  it('should correctly exchange a value between currencies', () => {
    spyOn(service, 'getExchangeQuote').and.callFake((from, to) => {
      if (from === Currency.USD && to === Currency.EUR) return 0.85;
      if (from === Currency.EUR && to === Currency.USD) return 1.18;
      return 0;
    });

    expect(service.exchange(100, Currency.USD, Currency.EUR)).toEqual({ currency: Currency.EUR, value: 85 });
    expect(service.exchange(100, Currency.EUR, Currency.USD)).toEqual({ currency: Currency.USD, value: 118 });
  });

  it('should convert currency to symbol', () => {
    spyOn(service['currencyPipe'], 'transform').and.callThrough()
    // callFake((value: number | string | undefined | null, currencyCode?: string, display?: "code" | "symbol" | "symbol-narrow" | string | boolean, digitsInfo?: string, locale?: string): string | null => {
    //   if (currencyCode === Currency.USD) return '$1.0' as string | null;
    //   if (currencyCode === Currency.EUR) return '€1.0' as string | null;
    //   return '' as string | null;
    // });

    expect(service.currencyToSymbol(Currency.USD)).toBe('$');
    expect(service.currencyToSymbol(Currency.EUR)).toBe('€');
    expect(service.currencyToSymbol('XXX')).toBe('XXX');
  });

  it('should enhance exchange info for given properties', () => {
    spyOn(service, 'exchange').and.callFake((value, from, to) => ({
      currency: to,
      value: value * 0.85
    }));
    spyOn(service, 'currencyDefault').and.returnValue(Currency.EUR);

    const obj = { price: 100, volume: 200 };
    const result = service.enhanceExchangeInfo(obj, Currency.USD, ['price', 'volume']);

    expect(result).toEqual({
      price: {
        original: { value: 100, currency: Currency.USD },
        exchanged: { value: 85, currency: Currency.EUR }
      },
      volume: {
        original: { value: 200, currency: Currency.USD },
        exchanged: { value: 170, currency: Currency.EUR }
      }
    });
  });
});
