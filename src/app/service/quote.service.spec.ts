import { TestBed } from '@angular/core/testing';

import { QuoteService } from './quote.service';
import { SourceService } from './source.service';
import { RemoteQuotesService } from './remote-quotes.service';

class MyService {

}

describe('QuoteService', () => {
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
});
