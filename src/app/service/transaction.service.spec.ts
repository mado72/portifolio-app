import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TransactionDialogComponent, TransactionDialogType } from '../investment/transaction-dialog/transaction-dialog.component';
import { Currency } from '../model/domain.model';
import { InvestmentEnum, TransactionStatus } from '../model/investment.model';
import { AssetQuoteType, InvestmentTransactionType, PortfolioType } from '../model/source.model';
import { AssetService } from './asset.service';
import { PortfolioService } from './portfolio-service';
import { QuoteService } from './quote.service';
import { SourceService } from './source.service';
import { TransactionService } from './transaction.service';


describe('TransactionService', () => {
  let service: TransactionService;
  let dialogMock: jasmine.SpyObj<MatDialog>;
  let routerMock: jasmine.SpyObj<Router>;
  let portfolioServiceMock: jasmine.SpyObj<PortfolioService>;
  let sourceServiceMock: jasmine.SpyObj<SourceService>;
  let quoteServiceMock: jasmine.SpyObj<QuoteService>;
  let dialogRefMock: jasmine.SpyObj<MatDialogRef<TransactionDialogComponent, any>>;
  let assetService: AssetService;
  let assetServiceMock: jasmine.SpyObj<AssetService>;

  // Mock data
  const mockTransaction: InvestmentTransactionType = {
    id: 'transaction-1',
    ticker: 'NYSE:AAPL',
    date: new Date('2025-04-19'),
    accountId: 'account-1',
    quantity: 10,
    quote: 200.50,
    value: { value: 2005, currency: Currency.USD },
    type: InvestmentEnum.BUY,
    status: TransactionStatus.COMPLETED
  };

  const mockAsset = {
    ticker: 'NYSE:AAPL',
    name: 'Apple Inc.',
    quote: {
      value: 200.50,
      currency: 'USD'
    }
  };

  const mockPortfolios = [
    { id: 'portfolio-1', name: 'Portfolio 1', allocations: {} } as PortfolioType,
    { id: 'portfolio-2', name: 'Portfolio 2', allocations: {} } as PortfolioType
  ];

  const mockAllocations = [
    { id: 'portfolio-1', name: 'Portfolio 1', quantity: 5 },
    { id: 'portfolio-2', name: 'Portfolio 2', quantity: 5 }
  ];

  const assets$ = signal({});

  class MockAssetService {

    get assets (){
      return (() => (assets$())) as any;
    }
    set assets(assets: Record<string, AssetQuoteType>) {
      assets$.set(assets);
    }
    newDialog(asset: AssetQuoteType) {
      return of(asset);
    }
  }

  beforeEach(() => {
    assets$.set({});
    // Create spy objects for services

    dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    portfolioServiceMock = jasmine.createSpyObj('PortfolioService', [
      'portfolioAllocation',
      'processAllocations',
      'getAllPortfolios',
      'updatePortfolio'
    ]);

    sourceServiceMock = jasmine.createSpyObj('SourceService', [
      'investmentSource',
      'portfolioSource',
      'updateInvestmentTransaction',
      'addInvestmentTransaction',
      'deleteInvestmentTransaction',
      'currencyDefault'
    ]);
    quoteServiceMock = jasmine.createSpyObj('QuoteService', ['addPendding']);
    dialogRefMock = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);

    // Configure mock return values
    portfolioServiceMock.portfolioAllocation.and.returnValue([]);
    portfolioServiceMock.getAllPortfolios.and.returnValue(mockPortfolios);
    sourceServiceMock.investmentSource.and.returnValue({ 'transaction-1': mockTransaction });
    sourceServiceMock.portfolioSource.and.returnValue({
      'portfolio-1': { id: 'portfolio-1', name: 'Portfolio 1' } as PortfolioType,
      'portfolio-2': { id: 'portfolio-2', name: 'Portfolio 2' } as PortfolioType
    });
    sourceServiceMock.currencyDefault.and.returnValue(Currency.USD);
    dialogMock.open.and.returnValue(dialogRefMock);
    dialogRefMock.afterClosed.and.returnValue(of(null));

    TestBed.configureTestingModule({
      providers: [
        TransactionService,
        { provide: MatDialog, useValue: dialogMock },
        { provide: Router, useValue: routerMock },
        { provide: PortfolioService, useValue: portfolioServiceMock },
        { provide: AssetService, useClass: MockAssetService },
        { provide: SourceService, useValue: sourceServiceMock },
        { provide: QuoteService, useValue: quoteServiceMock }
      ]
    });

    assetService = TestBed.inject(AssetService);
    service = TestBed.inject(TransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createTransactionAllocations', () => {
    it('should return allocations based on portfolio source', () => {
      const result = service.createTransactionAllocations();
      expect(result).toEqual([
        { id: 'portfolio-1', name: 'Portfolio 1', qty: 0 },
        { id: 'portfolio-2', name: 'Portfolio 2', qty: 0 }
      ]);
    });
  });

  describe('saveTransaction', () => {
    // Test 1: should save a transaction when the asset exists
    it('should save a transaction when the asset exists', () => {
      // Arrange
      assets$.set({ 'NYSE:AAPL': mockAsset } as unknown as Record<string, AssetQuoteType>);
      spyOn(service as any, 'persistTransaction');
      
      // Act
      let result: InvestmentTransactionType | undefined;
      service.saveTransaction(mockTransaction).subscribe(transaction => {
        result = transaction;
      });
      
      // Assert
      expect(result).toEqual(mockTransaction);
      expect(quoteServiceMock.addPendding).toHaveBeenCalledWith('NYSE:AAPL');
      expect((service as any).persistTransaction).toHaveBeenCalledWith(mockTransaction, undefined);
    });

    // Test 2: should open a new dialog and save a transaction when the asset does not exist
    it('should open a new dialog and save a transaction when the asset does not exist', () => {
      // Arrange
      
      // Mock that asset is added after dialog is closed
      const newDialog = spyOn(assetService, 'newDialog').and.callFake(() => {
        assets$.set({ 'NYSE:AAPL': mockAsset } as unknown as Record<string, AssetQuoteType>);
        return of({ 'NYSE:AAPL': mockAsset } as any);
      });
      spyOn(service as any, 'persistTransaction');
      
      // Act
      let result: InvestmentTransactionType | undefined;
      service.saveTransaction(mockTransaction).subscribe(transaction => {
        result = transaction;
      });
      
      // Assert
      expect(newDialog).toHaveBeenCalledWith('NYSE:AAPL');
      expect(result).toEqual(mockTransaction);
      expect(quoteServiceMock.addPendding).toHaveBeenCalledWith('NYSE:AAPL');
      expect((service as any).persistTransaction).toHaveBeenCalledWith(mockTransaction, undefined);
    });

    // Test 3: should throw an error if the asset is not found after opening the dialog
    it('should throw an error if the asset is not found after opening the dialog', () => {
      // Arrange
      const newDialog = spyOn(assetService, 'newDialog').and.returnValue(of({} as any));
      
      // Mock that asset is still not available after dialog is closed
      spyOn(service as any, 'persistTransaction');
      
      // Act & Assert
      service.saveTransaction(mockTransaction).subscribe({
        next: () => fail('should have thrown an error'),
        error: (error) => {
          expect(error.message).toBe('Asset not found');
        }
      });
      
      expect(newDialog).toHaveBeenCalledWith('NYSE:AAPL');
      expect((service as any).persistTransaction).not.toHaveBeenCalled();
    });

    // Test 4: should save a transaction and process allocations
    it('should save a transaction and process allocations', () => {
      // Arrange
      assets$.set({ 'NYSE:AAPL': mockAsset } as unknown as Record<string, AssetQuoteType>);

      const allocations = { 'portfolio-1': 5, 'portfolio-2': 5 };
      spyOn(service as any, 'persistTransaction');
      
      // Act
      let result: InvestmentTransactionType | undefined;
      service.saveTransaction(mockTransaction, allocations).subscribe(transaction => {
        result = transaction;
      });
      
      // Assert
      expect(result).toEqual(mockTransaction);
      expect(quoteServiceMock.addPendding).toHaveBeenCalledWith('NYSE:AAPL');
      expect((service as any).persistTransaction).toHaveBeenCalledWith(mockTransaction, allocations);
    });

    // Test 5: should handle missing asset and open new asset dialog
    it('should handle missing asset and open new asset dialog', () => {
      // Arrange
      // Mock that asset is added after dialog is closed
      const updatedAssets = { 'NYSE:AAPL': { ...mockAsset, quote: { value: 210.50, currency: 'EUR' } } } as unknown as Record<string, AssetQuoteType>;

      spyOn(service as any, 'persistTransaction');
      assets$.set({});

      const assetServiceSpy = TestBed.inject(AssetService);
      spyOn(assetServiceSpy, 'newDialog').and.callFake(() => {
        assets$.set(updatedAssets);
        return of(updatedAssets['NYSE:AAPL']);
      });
      
      const transactionWithoutCurrency = { ...mockTransaction };
      transactionWithoutCurrency.value = { value: 2005, currency: Currency.USD };
      
      // Act
      let result: InvestmentTransactionType | undefined;
      service.saveTransaction(transactionWithoutCurrency).subscribe(transaction => {
        result = transaction;
      });
      
      // Assert
      expect(assetServiceSpy.newDialog).toHaveBeenCalledWith('NYSE:AAPL');
      expect(result).toEqual(transactionWithoutCurrency);
      expect(transactionWithoutCurrency.value.currency).toBe('EUR');
      expect(quoteServiceMock.addPendding).toHaveBeenCalledWith('NYSE:AAPL');
      expect((service as any).persistTransaction).toHaveBeenCalledWith(transactionWithoutCurrency, undefined);
    });
  });

  describe('persistTransaction', () => {
    it('should update existing transaction', () => {
      // Act
      (service as any).persistTransaction(mockTransaction);
      
      // Assert
      expect(sourceServiceMock.updateInvestmentTransaction).toHaveBeenCalledWith([mockTransaction]);
      expect(sourceServiceMock.addInvestmentTransaction).not.toHaveBeenCalled();
    });

    it('should add new transaction', () => {
      // Arrange
      const newTransaction = { ...mockTransaction, id: '' };
      
      // Act
      (service as any).persistTransaction(newTransaction);
      
      // Assert
      expect(sourceServiceMock.addInvestmentTransaction).toHaveBeenCalledWith(newTransaction);
      expect(sourceServiceMock.updateInvestmentTransaction).not.toHaveBeenCalled();
    });

    it('should process allocations if provided', () => {
      // Arrange
      const allocations = { 'portfolio-1': 5, 'portfolio-2': 5 };
      
      // Act
      (service as any).persistTransaction(mockTransaction, allocations);
      
      // Assert
      expect(portfolioServiceMock.processAllocations).toHaveBeenCalledWith(
        'NYSE:AAPL', 
        'transaction-1', 
        200.50, 
        allocations
      );
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction', () => {
      // Act
      service.deleteTransaction('transaction-1');
      
      // Assert
      expect(sourceServiceMock.deleteInvestmentTransaction).toHaveBeenCalledWith('transaction-1');
    });
  });

  describe('openDialog', () => {
    it('should open dialog with correct data', () => {
      // Arrange
      const dialogData: TransactionDialogType = {
        newTransaction: true,
        title: 'Test Dialog',
        transaction: mockTransaction,
        portfolios: mockAllocations
      };
      
      // Act
      service.openDialog(dialogData);
      
      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(TransactionDialogComponent, {
        data: dialogData
      });
    });

    it('should save transaction and update portfolios when dialog is closed with result', () => {
      // Arrange
      const dialogData: TransactionDialogType = {
        newTransaction: true,
        title: 'Test Dialog',
        transaction: mockTransaction,
        portfolios: []
      };
      
      const dialogResult: TransactionDialogType = {
        newTransaction: true,
        title: 'Test Dialog',
        transaction: { ...mockTransaction, quantity: 15 },
        portfolios: [
          { id: 'portfolio-1', name: 'Portfolio 1', quantity: 10 },
          { id: 'portfolio-2', name: 'Portfolio 2', quantity: 5 }
        ]
      };
      
      dialogRefMock.afterClosed.and.returnValue(of(dialogResult));
      spyOn(service, 'saveTransaction').and.returnValue(of(mockTransaction));
      
      // Act
      service.openDialog(dialogData);
      
      // Assert
      expect(service.saveTransaction).toHaveBeenCalledWith({
        ...mockTransaction,
        ...dialogResult.transaction
      });
      expect(portfolioServiceMock.updatePortfolio).toHaveBeenCalledTimes(2);
    });

    it('should not update anything when dialog is closed without result', () => {
      // Arrange
      const dialogData: TransactionDialogType = {
        newTransaction: true,
        title: 'Test Dialog',
        transaction: mockTransaction,
        portfolios: []
      };
      
      dialogRefMock.afterClosed.and.returnValue(of(null));
      spyOn(service, 'saveTransaction');
      
      // Act
      service.openDialog(dialogData);
      
      // Assert
      expect(service.saveTransaction).not.toHaveBeenCalled();
      expect(portfolioServiceMock.updatePortfolio).not.toHaveBeenCalled();
    });
  });

  describe('navigation methods', () => {
    it('should navigate to create transaction page', () => {
      // Act
      service.createTransaction();
      
      // Assert
      expect(routerMock.navigate).toHaveBeenCalledWith(['investment', 'transactions', 'create']);
    });

    it('should navigate to edit transaction page', () => {
      // Act
      service.editTransaction('transaction-1');
      
      // Assert
      expect(routerMock.navigate).toHaveBeenCalledWith(['investment', 'transactions', 'edit', 'transaction-1']);
    });

    it('should navigate to transactions list page', () => {
      // Act
      service.listTransactions();
      
      // Assert
      expect(routerMock.navigate).toHaveBeenCalledWith(['investment', 'transactions']);
    });
  });

  describe('openAddDialog', () => {
    it('should open dialog with correct default data', () => {
      // Arrange
      spyOn(service, 'openDialog');
      
      // Act
      service.openAddDialog();
      
      // Assert
      expect(service.openDialog).toHaveBeenCalledWith({
        newTransaction: true,
        title: 'Adicionar Transação',
        transaction: {
          id: '',
          ticker: '',
          date: jasmine.any(Date),
          accountId: '',
          quantity: 0,
          quote: NaN,
          value: { value: 0, currency: Currency.USD },
          type: InvestmentEnum.BUY,
          status: TransactionStatus.COMPLETED
        },
        portfolios: []
      });
    });
  });
});
