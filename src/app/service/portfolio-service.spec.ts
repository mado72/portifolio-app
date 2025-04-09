import { TestBed } from '@angular/core/testing';

import { PortfolioService } from './portfolio-service';
import { SourceService } from './source.service';
import { MatDialog } from '@angular/material/dialog';
import { QuoteService } from './quote.service';

class MyService {

}
describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SourceService, useClass: MyService},
        { provide: MatDialog, useClass: MyService},
        { provide: QuoteService, useClass: MyService },
      ]
    });
    service = TestBed.inject(PortfolioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
