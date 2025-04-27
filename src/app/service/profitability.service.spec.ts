import { TestBed } from '@angular/core/testing';
import { ProfitabilityService } from './profitalibilty.service';
import { provideExchangeServiceMock, providePortfolioServiceMock } from './service-mock.spec';

describe('ProfitabilityService', () => {
  let service: ProfitabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideExchangeServiceMock(),
        providePortfolioServiceMock(),
      ]
    });
    service = TestBed.inject(ProfitabilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
