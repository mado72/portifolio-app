import { TestBed } from '@angular/core/testing';

import { CoinService } from './coin-remote.service';
import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';

class MyService {

}
describe('CoinService', () => {
  let service: CoinService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: YahooRemoteQuotesService, useClass: MyService }
      ]
    });
    service = TestBed.inject(CoinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
