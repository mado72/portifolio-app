import { TestBed } from '@angular/core/testing';

import { TransactionService } from './transaction.service';
import { PortfolioService } from './portfolio-service';
import { SourceService } from './source.service';

class MyService {

}

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PortfolioService, useClass: MyService },
        { provide: SourceService, useClass: MyService },
      ]
    });
    service = TestBed.inject(TransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
