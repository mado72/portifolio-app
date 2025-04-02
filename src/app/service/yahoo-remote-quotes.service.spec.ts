import { TestBed } from '@angular/core/testing';

import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';

describe('YahooRemoteQuotesService', () => {
  let service: YahooRemoteQuotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(YahooRemoteQuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
