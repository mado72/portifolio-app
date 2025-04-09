import { TestBed } from '@angular/core/testing';

import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';


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
});
