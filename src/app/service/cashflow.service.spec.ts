import { TestBed } from '@angular/core/testing';

import { CashflowService } from './cashflow.service';
import { SourceService } from './source.service';
import { MatDialog } from '@angular/material/dialog';
import { ExchangeService } from './exchange.service';

describe('CashflowService', () => {
  let service: CashflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CashflowService,
        { provide: SourceService, useValue: jasmine.createSpyObj('SourceService', ['addScheduledTransaction', 'updateScheduledTransaction']) },
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) },
        { provide: ExchangeService, useValue: jasmine.createSpyObj('ExchangeService', ['currencyDefault']) }
      ]
    });
    service = TestBed.inject(CashflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
