import { discardPeriodicTasks, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';

import { QuoteService } from './quote.service';
import { SourceService } from './source.service';
import { RemoteQuotesService } from './remote-quotes.service';
import { of } from 'rxjs';
import { AssetQuoteRecord, AssetQuoteType } from '../model/source.model';
import { Currency, CurrencyType } from '../model/domain.model';
import { QuoteResponse } from '../model/remote-quote.model';
import { signal } from '@angular/core';
import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';
import { CoinService } from './coin-remote.service';

class MyService {
  updateQuotes() { return of(null) }
  getRemoteQuote() { }
  updateAsset() { }
  assetSource = signal({})
  exchanges() { }
  currencyDefault = signal(Currency.BRL);
  price() { }
  updateExchanges() {}
  priceWithSingleRequest() { return of(null)}
}

describe('QuoteService', () => {
  let service: QuoteService;


  describe("Using MyService...", () => {

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: SourceService, useClass: MyService },
          { provide: RemoteQuotesService, useClass: MyService }
        ]
      });
      service = TestBed.inject(QuoteService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should call remoteQuotesService.updateQuotes with the correct request', () => {
      const request = {
        ticker1: {
          ticker: 'ticker1',
          lastUpdate: new Date(),
          quote: { value: 100, currency: Currency.USD },
        } as AssetQuoteType
      } as Record<string, AssetQuoteType>;
      const updateQuotesSpy = spyOn(TestBed.inject(RemoteQuotesService), 'updateQuotes').and.returnValue(of({}));
      const setLastUpdateSpy = spyOn(service.lastUpdate, 'set');
      const setQuotePenddingSpy = spyOn(service.quotePendding, 'set');

      service['updateTrigger'].next(request);

      expect(updateQuotesSpy).toHaveBeenCalledWith(request);
      expect(setLastUpdateSpy).toHaveBeenCalled();
      expect(setQuotePenddingSpy).toHaveBeenCalledWith(new Set());
    });

    describe("Controlling clock", () => {

      beforeEach(() => {
        jasmine.clock().install();
      })

      it('should throttle calls to remoteQuotesService.updateQuotes', fakeAsync(async() => {
        jasmine.clock().mockDate(new Date(2020, 0, 1, 17, 40, 0));
        const request = {
          ticker1: {
            ticker: 'ticker1',
            lastUpdate: new Date(),
            quote: { value: 100, currency: Currency.USD },
          } as AssetQuoteType
        } as Record<string, AssetQuoteType>;

        const updateQuotesSpy = spyOn(TestBed.inject(RemoteQuotesService), 'updateQuotes').and.returnValue(of({quote1: "value1"  as unknown as QuoteResponse}));
        spyOn(service.lastUpdate, 'set');
        spyOn(service.quotePendding, 'set');

        console.log(new Date());
        
        for (let x = 0; x < 10; x++) {
          tick(6 * 1000);
          console.log(new Date());
          service['updateTrigger'].next(request);
        }
        expect(updateQuotesSpy).toHaveBeenCalledTimes(1);
        
        tick(10 * 1000);
        console.log(new Date());
        service['updateTrigger'].next(request);
        expect(updateQuotesSpy).toHaveBeenCalledTimes(2);
        
        for (let x = 0; x < 10; x++) {
          tick(2 * 6 * 1000);
          service['updateTrigger'].next(request);
        }
        
        expect(updateQuotesSpy).toHaveBeenCalledTimes(4);
        discardPeriodicTasks();
      }));

      afterEach(() => {
        jasmine.clock().uninstall();
      })
    })

    it('should update lastUpdate and clear quotePendding after successful update', () => {
      const request = {
        ticker1: {
          ticker: 'ticker1',
          lastUpdate: new Date(),
          quote: { value: 100, currency: Currency.USD },
        } as AssetQuoteType
      } as Record<string, AssetQuoteType>;

      spyOn(TestBed.inject(RemoteQuotesService), 'updateQuotes').and.returnValue(of({}));
      const setLastUpdateSpy = spyOn(service.lastUpdate, 'set');
      const setQuotePenddingSpy = spyOn(service.quotePendding, 'set');

      service['updateTrigger'].next(request);

      expect(setLastUpdateSpy).toHaveBeenCalledWith(jasmine.any(Date));
      expect(setQuotePenddingSpy).toHaveBeenCalledWith(new Set());
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
      spyOn(service['sourceService'], 'currencyDefault').and.returnValue(Currency.EUR);

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

    it('should update quote asset with remote quote if not manual', () => {
      const asset = {
        ticker: 'ticker1',
        marketPlace: 'NYSE',
        code: 'AAPL',
        manualQuote: false
      } as AssetQuoteType;

      const remoteQuote = { price: 150, currency: Currency.USD };
      spyOn(service['remoteQuotesService'], 'getRemoteQuote').and.returnValue(of(remoteQuote as unknown as QuoteResponse));
      spyOn(service.quotePendding, 'update');

      service.updateQuoteAsset(asset);

      expect(service['remoteQuotesService'].getRemoteQuote).toHaveBeenCalledWith('NYSE', 'AAPL');
      expect(service.quotePendding.update).toHaveBeenCalledWith(jasmine.any(Function));
    });

    it('should update quote asset with source service if manual', () => {
      const asset = {
        ticker: 'ticker1',
        marketPlace: 'NYSE',
        code: 'AAPL',
        manualQuote: true
      } as AssetQuoteType;

      spyOn(service['sourceService'], 'updateAsset');

      service.updateQuoteAsset(asset);

      expect(service['sourceService'].updateAsset).toHaveBeenCalledWith([asset]);
    });

    it('should get remote asset info for a ticker', () => {
      const ticker = 'NYSE:AAPL';
      spyOn(service['remoteQuotesService'], 'getRemoteQuote').and.returnValue(of({} as unknown as QuoteResponse));

      service.getRemoteAssetInfo(ticker);

      expect(service['remoteQuotesService'].getRemoteQuote).toHaveBeenCalledWith('NYSE', 'AAPL');
    });

  })

  class MockCoinService {
    getExchanges() {
      return of({});
    }
  }

  describe("Using real RemoteQuotesService ", () => {

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          RemoteQuotesService,
          { provide: CoinService, useClass: MockCoinService },
          { provide: YahooRemoteQuotesService, useClass: MyService },
          { provide: SourceService, useClass: MyService },
        ]
      })

      service = TestBed.inject(QuoteService)
    })

    it('should get remote quote for a ticker', (done) => {
      const ticker = 'NYSE:AAPL';
      const remoteQuote = { price: 150 };
      spyOn(service, 'getRemoteAssetInfo').and.returnValue(of(remoteQuote as unknown as QuoteResponse));
      spyOn(service, "lastUpdate")
      spyOn(service["sourceService"], "assetSource")
      spyOn(service, "quotePendding")
      
      service.getRemoteQuote(ticker).subscribe((price) => {
        debugger;
        expect(price).toBe(150);
        done();
      });
    });

    it('should add a ticker to quotePendding when addPendding is called', () => {
      const ticker = 'ticker1';
      spyOn(service["sourceService"], "assetSource").and.returnValue({ticker1: {}} as unknown as AssetQuoteRecord)
      const quotePenddingSpy = spyOn(service["quotePendding"], "update");
      const updateTriggerSpy = spyOn(service["updateTrigger"], "next");
      service.addPendding(ticker);

      expect(updateTriggerSpy).toHaveBeenCalledTimes(1);
      expect(quotePenddingSpy).toHaveBeenCalledTimes(1);
    });

  })
});
