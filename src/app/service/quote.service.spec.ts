import { TestBed } from '@angular/core/testing';

import { QuoteService } from './quote.service';
import { SourceService } from './source.service';
import { RemoteQuotesService } from './remote-quotes.service';
import { of } from 'rxjs';
import { AssetQuoteType } from '../model/source.model';
import { Currency } from '../model/domain.model';

class MyService {
  updateQuotes() {}
}

fdescribe('QuoteService', () => {
  let service: QuoteService;


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

    debugger;
    service['updateTrigger'].next(request);

    expect(updateQuotesSpy).toHaveBeenCalledWith(request);
    expect(setLastUpdateSpy).toHaveBeenCalled();
    expect(setQuotePenddingSpy).toHaveBeenCalledWith(new Set());
  });

  fdescribe("Controlling clock", ()=> {

    beforeEach(()=>{
      jasmine.clock().install();
    })

    it('should throttle calls to remoteQuotesService.updateQuotes', (done) => {
      jasmine.clock().mockDate(new Date(2020, 0, 1, 17, 40, 0));
      const request = {
        ticker1: {
          ticker: 'ticker1', 
          lastUpdate: new Date(),
          quote: { value: 100, currency: Currency.USD },
        } as AssetQuoteType
      } as Record<string, AssetQuoteType>;
  
      const updateQuotesSpy = spyOn(TestBed.inject(RemoteQuotesService), 'updateQuotes').and.returnValue(of({}));
  
      for (let x = 0; x < 10; x++) {
        jasmine.clock().mockDate(new Date(2020, 0, 1, 17, 40, x));
        service['updateTrigger'].next(request);
      }
      expect(updateQuotesSpy).toHaveBeenCalledTimes(1);
      
      jasmine.clock().mockDate(new Date(2020, 0, 1, 17, 50, 0));
      expect(updateQuotesSpy).toHaveBeenCalledTimes(1);
  
      for (let x = 0; x < 10; x++) {
        service['updateTrigger'].next(request);
        jasmine.clock().mockDate(new Date(2020, 0, 1, 17, 50, x));
      }
      expect(updateQuotesSpy).toHaveBeenCalledTimes(2);
    });

    afterEach(()=> {
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

  it('should add a ticker to quotePendding when addPendding is called', () => {
    const ticker = 'ticker1';
    service.addPendding(ticker);
    expect(service.quotePendding()).toContain(ticker);
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
    };
    spyOn(service['remoteQuotesService'], 'exchanges').and.returnValue(exchanges);

    expect(service.getExchangeQuote(Currency.USD, Currency.EUR)).toBe(0.85);
    expect(service.getExchangeQuote(Currency.EUR, Currency.USD)).toBe(1.18);
    expect(service.getExchangeQuote(Currency.USD, 'GBP' as Currency)).toBeUndefined();
  });

  it('should correctly exchange a value between currencies', () => {
    spyOn(service, 'getExchangeQuote').and.callFake((from, to) => {
      if (from === Currency.USD && to === Currency.EUR) return 0.85;
      if (from === Currency.EUR && to === Currency.USD) return 1.18;
      return undefined;
    });

    expect(service.exchange(100, Currency.USD, Currency.EUR)).toEqual({ currency: Currency.EUR, value: 85 });
    expect(service.exchange(100, Currency.EUR, Currency.USD)).toEqual({ currency: Currency.USD, value: 118 });
  });

  it('should convert currency to symbol', () => {
    spyOn(service['currencyPipe'], 'transform').and.callFake((value, currency, display) => {
      if (currency === Currency.USD) return '$1.0';
      if (currency === Currency.EUR) return '€1.0';
      return null;
    });

    expect(service.currencyToSymbol(Currency.USD)).toBe('$');
    expect(service.currencyToSymbol(Currency.EUR)).toBe('€');
    expect(service.currencyToSymbol('GBP')).toBe('GBP');
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
    spyOn(service['remoteQuotesService'], 'getRemoteQuote').and.returnValue(of(remoteQuote));
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
    spyOn(service['remoteQuotesService'], 'getRemoteQuote').and.returnValue(of({}));

    service.getRemoteAssetInfo(ticker);

    expect(service['remoteQuotesService'].getRemoteQuote).toHaveBeenCalledWith('NYSE', 'AAPL');
  });

  it('should get remote quote for a ticker', (done) => {
    const ticker = 'NYSE:AAPL';
    const remoteQuote = { price: 150 };
    spyOn(service, 'getRemoteAssetInfo').and.returnValue(of(remoteQuote));

    service.getRemoteQuote(ticker).subscribe((price) => {
      expect(price).toBe(150);
      done();
    });
  });
});
