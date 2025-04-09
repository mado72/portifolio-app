import { TestBed } from '@angular/core/testing';

import { InvestmentService } from './investment.service';
import { QuoteService } from './quote.service';

class MyService {

}

describe('InvestmentService', () => {
  let service: InvestmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: QuoteService, useClass: MyService }
      ]
    });
    service = TestBed.inject(InvestmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
