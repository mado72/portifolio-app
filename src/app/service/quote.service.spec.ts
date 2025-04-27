import { TestBed } from '@angular/core/testing';

import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Currency } from '../model/domain.model';
import { QuoteService } from './quote.service';
import { RemoteQuotesService } from './remote-quotes.service';

class MyService {
  updateAsset() { }
  assetSource = signal({})
  exchanges() { }
  currencyDefault = signal(Currency.BRL);
  price() { }
  updateExchanges() { }
  priceWithSingleRequest() { return of(null) }
}

describe('QuoteService', () => {
  let service: QuoteService;
  let remoteQuotesServiceMock: jasmine.SpyObj<RemoteQuotesService> = jasmine.createSpyObj('RemoteQuotesService', ['updateQuotes', 'getRemoteQuote']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: RemoteQuotesService, useFactory: () => remoteQuotesServiceMock },
      ]
    });
    service = TestBed.inject(QuoteService);
    remoteQuotesServiceMock = TestBed.inject(RemoteQuotesService) as jasmine.SpyObj<RemoteQuotesService>;
  }
  );

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
