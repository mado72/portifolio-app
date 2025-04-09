import { TestBed } from '@angular/core/testing';

import { AssetService } from './asset.service';
import { SourceService } from './source.service';
import { InvestmentService } from './investment.service';
import { QuoteService } from './quote.service';

class MyService {

}

describe('AssetService', () => {
  let service: AssetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SourceService, useClass: MyService},
        { provide: QuoteService, useClass: MyService},
        { provide: InvestmentService, useClass: MyService},
      ]
    });
    service = TestBed.inject(AssetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
