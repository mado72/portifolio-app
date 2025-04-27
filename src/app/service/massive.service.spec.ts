import { TestBed } from '@angular/core/testing';

import { MassiveService } from './massive.service';
import { providePortfolioServiceMock } from './service-mock.spec';
import { TransactionService } from './transaction.service';

describe('MassiveService', () => {
  let service: MassiveService;
  let transactionServiceMock: jasmine.SpyObj<TransactionService> = jasmine.createSpyObj('TransactionService', ['saveTransaction']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        providePortfolioServiceMock(),
        { provide: TransactionService, useFactory: () => transactionServiceMock, deps: [] },
      ]
    });
    service = TestBed.inject(MassiveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
