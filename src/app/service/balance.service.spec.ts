import { TestBed } from '@angular/core/testing';

import { BalanceService } from './balance.service';
import { QuoteService } from './quote.service';

class MyService {

}

describe('BalanceService', () => {
  let service: BalanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: QuoteService, useClass: MyService }
      ]
    });
    service = TestBed.inject(BalanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
