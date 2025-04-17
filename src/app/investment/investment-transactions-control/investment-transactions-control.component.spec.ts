import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentTransactionsControlComponent } from './investment-transactions-control.component';
import { InvestmentTransactionFormResult } from '../investment-transaction-form/investment-transaction-form.component';
import { Currency } from '../../model/domain.model';
import { InvestmentEnum, TransactionStatus } from '../../model/investment.model';
import { AssetQuoteRecord, AssetQuoteType } from '../../model/source.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SourceService } from '../../service/source.service';
import { AssetService } from '../../service/asset.service';
import { TransactionService } from '../../service/transaction.service';
import { PortfolioService } from '../../service/portfolio-service';
import { QuoteService } from '../../service/quote.service';
import { signal } from '@angular/core';

class MockService {
  snapshot = {
    data: {
      action: null
    },
    paramMap: new Map<string,any>()
  }

  investmentTransactions = signal([]);
  quotePendding = signal(null as any);
  investmentSource = signal({});

  assertSource() {}
  saveTransaction() {}
  processAllocations() {}
}

describe('InvestmentTransactionsControlComponent', () => {
  let component: InvestmentTransactionsControlComponent;
  let fixture: ComponentFixture<InvestmentTransactionsControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentTransactionsControlComponent],
      providers: [
        { provide: Router, useClass: MockService },
        { provide: ActivatedRoute, useClass: MockService },
        { provide: SourceService, useClass: MockService },
        { provide: AssetService, useClass: MockService },
        { provide: PortfolioService, useClass: MockService },
        { provide: QuoteService, useClass: MockService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InvestmentTransactionsControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save a transaction and process allocations', () => {
    const mockTransaction = { "accountId": "mockAccountId", 
      "date": new Date("2025-04-16T12:00:00.000Z"), "id": "5", 
      "quantity": 20, "quote": 33.76, 
      "status": "PENDING", "ticker": "BVMF:TAEE11", 
      "type": "BUY", "value": { "currency": "BRL", "value": 675.2 }, 
      "allocations": [{ "id": "Portfolio1", "qty": 20 }] 
    } as unknown as InvestmentTransactionFormResult;

    const mockSource = { "BVMF:TAEE11": { marketPlace: "BVMF", code: "TAEE11", name: 'Taesa' } } as unknown as AssetQuoteRecord;

    spyOn(component['transactionService'], 'saveTransaction');
    spyOn(component['portfolioService'], 'processAllocations');
    spyOn(component['quoteService'].quotePendding, 'set');
    spyOn(component['sourceService'], 'assertSource').and.returnValue(mockSource);

    component.saveTransaction(mockTransaction);
    expect(component['transactionService'].saveTransaction).toHaveBeenCalledWith({
      id: '5',
      accountId: 'mockAccountId',
      ticker: 'BVMF:TAEE11',
      quantity: 20,
      quote: 33.76,
      value: { currency: Currency.BRL, value: 675.2 },
      status: TransactionStatus.COMPLETED,
      date: new Date("2025-04-16T12:00:00.000Z"),
      type: InvestmentEnum.BUY,
    });
    expect(component['portfolioService'].processAllocations).toHaveBeenCalledWith('BVMF:TAEE11', 10, { Portfolio1: 20 });
    expect(component['quoteService'].quotePendding.set).toHaveBeenCalledTimes(1);
  });

  it('should handle missing asset and open new asset dialog', () => {
    const mockTransaction = {
      ticker: 'GOOG',
      allocations: [{ id: 'portfolio2', qty: 5 }],
    } as unknown as InvestmentTransactionFormResult;

    spyOn(component['sourceService'], 'assertSource').and.returnValue({});
    spyOn(component['assetService'], 'newDialog').and.returnValue({
      subscribe: (callback: () => void) => callback(),
    } as any);
    spyOn(component, 'saveTransaction').and.callThrough();

    component.saveTransaction(mockTransaction);

    expect(component['assetService'].newDialog).toHaveBeenCalledWith('GOOG');
    expect(component.saveTransaction).toHaveBeenCalledTimes(2); // Called recursively after asset creation
  });
});
