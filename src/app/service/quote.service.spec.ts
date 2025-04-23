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
  let remoteQuotesServiceMock: jasmine.SpyObj<RemoteQuotesService>;

  describe("Using MyService...", () => {

    beforeEach(() => {
      remoteQuotesServiceMock = jasmine.createSpyObj('RemoteQuotesService', [
        'updateQuotes',
        'getRemoteQuote'
      ])

      TestBed.configureTestingModule({
        providers: [
          { provide: SourceService, useClass: MyService },
          { provide: RemoteQuotesService, useValue: remoteQuotesServiceMock }
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
      
      const updateQuotesSpy = remoteQuotesServiceMock.updateQuotes.and.returnValue(of({}));
      const setLastUpdateSpy = spyOn(service.lastUpdate, 'set');
      const setQuotePenddingSpy = spyOn(service.penddingToQuote, 'set');

      service['updateTrigger'].next();

      expect(updateQuotesSpy).toHaveBeenCalledWith(request);
      expect(setLastUpdateSpy).toHaveBeenCalled();
      expect(setQuotePenddingSpy).toHaveBeenCalledWith({});
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
        spyOn(service.penddingToQuote, 'set');

        console.log(new Date());
        
        for (let x = 0; x < 10; x++) {
          tick(6 * 1000);
          console.log(new Date());
          service['updateTrigger'].next();
        }
        expect(updateQuotesSpy).toHaveBeenCalledTimes(1);
        
        tick(10 * 1000);
        console.log(new Date());
        service['updateTrigger'].next();
        expect(updateQuotesSpy).toHaveBeenCalledTimes(2);
        
        for (let x = 0; x < 10; x++) {
          tick(2 * 6 * 1000);
          service['updateTrigger'].next();
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
      const setQuotePenddingSpy = spyOn(service.penddingToQuote, 'set');

      service['updateTrigger'].next();

      expect(setLastUpdateSpy).toHaveBeenCalledWith(jasmine.any(Date));
      expect(setQuotePenddingSpy).toHaveBeenCalledWith({});
    });

    it('should update quote asset with remote quote if not manual when add asset to update', () => {
      const asset = {
        ticker: 'ticker1',
        marketPlace: 'NYSE',
        code: 'AAPL',
        manualQuote: false
      } as AssetQuoteType;

      const updateTriggerSpy = spyOn(service["updateTrigger"], "next");
      const penddingToQuote = spyOn(service["penddingToQuote"], "update");

      service.addAssetToUpdate(asset);

      expect(updateTriggerSpy).toHaveBeenCalledWith()
      expect(penddingToQuote).toHaveBeenCalledWith(jasmine.any(Function));
    });

    it('should update quote assets with remote quote if not manual when add assets to update', () => {
      const asset = {
        "NYSE:APPL": {
          ticker: 'ticker1',
          marketPlace: 'NYSE',
          code: 'AAPL',
          manualQuote: false,
        },
        "NYSE:PE": {
          ticker: 'ticker1',
          marketPlace: 'NYSE',
          code: 'PFE',
          manualQuote: false,
        }
      } as unknown as AssetQuoteRecord;

      const updateTriggerSpy = spyOn(service["updateTrigger"], "next");
      const penddingToQuote = spyOn(service["penddingToQuote"], "update");

      service.addAssetsToUpdate(asset);

      expect(updateTriggerSpy).toHaveBeenCalledTimes(1);
      expect(penddingToQuote).toHaveBeenCalledWith(jasmine.any(Function));
    });

    it('should update quote asset with source service if manual', () => {
      const asset = {
        ticker: 'ticker1',
        marketPlace: 'NYSE',
        code: 'AAPL',
        manualQuote: true
      } as AssetQuoteType;

      const updateTriggerSpy = spyOn(service["updateTrigger"], "next");
      const penddingToQuote = spyOn(service["penddingToQuote"], "update");

      service.addAssetToUpdate(asset);

      expect(updateTriggerSpy).not.toHaveBeenCalled();
      expect(penddingToQuote).not.toHaveBeenCalled();
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
      spyOn(service, "penddingToQuote")
      
      service.getRemoteQuote(ticker).subscribe((price) => {
        debugger;
        expect(price).toBe(150);
        done();
      });
    });

    it('should add an asset to quotePendding when addAssetToUpdate is called', () => {
      const asset = {
        ticker: 'ticker1',
        marketPlace: 'NYSE',
        code: 'AAPL',
        manualQuote: true
      } as AssetQuoteType;

      const penddingToQuoteSpy = spyOn(service["penddingToQuote"], "update");
      const updateTriggerSpy = spyOn(service["updateTrigger"], "next");
      service.addAssetToUpdate(asset);

      expect(updateTriggerSpy).toHaveBeenCalledTimes(1);
      expect(penddingToQuoteSpy).toHaveBeenCalledTimes(1);
    });

  })
});
