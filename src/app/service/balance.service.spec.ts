import { TestBed } from '@angular/core/testing';

import { BalanceService } from './balance.service';
import { SourceService } from './source.service';
import { provideExchangeServiceMock } from './service-mock.spec';

class MyService {

}

describe('BalanceService', () => {
  let service: BalanceService;
  let sourceServiceMock: jasmine.SpyObj<SourceService> = jasmine.createSpyObj('SourceService', [
    'balanceSource', 'scheduledSource', 'cashflowSource', 'addBalance', 'updateBalance', 
    'deleteBalance', 'addCashflowTransaction', 'updateCashflowTransaction'], {});

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideExchangeServiceMock(),
        { provide: SourceService, useFactory: () => sourceServiceMock },
      ]
    });
    service = TestBed.inject(BalanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
