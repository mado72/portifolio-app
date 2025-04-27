import { TestBed } from '@angular/core/testing';

import { AssetService } from './asset.service';
import { SourceService } from './source.service';
import { InvestmentService } from './investment.service';
import { QuoteService } from './quote.service';
import { provideExchangeServiceMock } from './service-mock.spec';
import { of } from 'rxjs';

class MyService {

}

describe('AssetService', () => {
  let service: AssetService;
  let quoteServiceMock: jasmine.SpyObj<QuoteService> = jasmine.createSpyObj('QuoteService', [
    'forceUpdate', 'addAssetsToUpdate', 'getRemoteAssetInfo'], {
    updateQuotes$: of({}),
    });


  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideExchangeServiceMock(),
        { provide: QuoteService, useFactory: () => quoteServiceMock},
        { provide: SourceService, useClass: MyService},
        { provide: InvestmentService, useClass: MyService},
      ]
    });
    service = TestBed.inject(AssetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
