import { TestBed } from '@angular/core/testing';

import { CoinService } from './coin-remote.service';
import { provideExchangeServiceMock } from './service-mock.spec';
import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';

describe('CoinService', () => {
  let service: CoinService;
  let yahooRemoteQuotesService: jasmine.SpyObj<YahooRemoteQuotesService> = jasmine.createSpyObj('YahooRemoteQuotesService', ['priceWithSingleRequest']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideExchangeServiceMock(),
        { provide: YahooRemoteQuotesService, useFactory: () => yahooRemoteQuotesService, deps: [] },
      ]
    });
    service = TestBed.inject(CoinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
