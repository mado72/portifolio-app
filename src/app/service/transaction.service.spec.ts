import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Currency } from '../model/domain.model';
import { InvestmentEnum, TransactionStatus } from '../model/investment.model';
import { AssetQuoteType, InvestmentTransactionType, PortfolioType } from '../model/source.model';
import { AssetService } from './asset.service';
import { assetServiceMock, assetsMock$, portfolioServiceMock, provideAssetServiceMock, providePortfolioServiceMock } from './service-mock.spec';
import { SourceService } from './source.service';
import { TransactionService } from './transaction.service';


describe('TransactionService', () => {
  let service: TransactionService;
  let dialogMock: jasmine.SpyObj<MatDialog>;
  let routerMock: jasmine.SpyObj<Router>;
  let sourceServiceMock: jasmine.SpyObj<SourceService>;

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

  beforeEach(() => {
    assetsMock$.set({});
    // Create spy objects for services

    dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    // portfolioServiceMock = jasmine.createSpyObj('PortfolioService', [
    //   'portfolioAllocation',
    //   'processAllocations',
    //   'portfolios'
    // ]);

    sourceServiceMock = jasmine.createSpyObj('SourceService', [
      'investmentSource',
      'updateInvestmentTransaction',
      'addInvestmentTransaction',
      'deleteInvestmentTransaction',
    ]);

    // assetServiceMock = jasmine.createSpyObj('AssetService', [
    //   'newDialog'
    // ])

    // Configure mock return values
    portfolioServiceMock.portfolioAllocation.and.returnValue([]);
    portfolioServiceMock.getAllPortfolios.and.returnValue(mockPortfolios);
    sourceServiceMock.investmentSource.and.returnValue({ 'transaction-1': mockTransaction });
    (portfolioServiceMock.portfolios as any).set({
      'portfolio-1': { id: 'portfolio-1', name: 'Portfolio 1' } as PortfolioType,
      'portfolio-2': { id: 'portfolio-2', name: 'Portfolio 2' } as PortfolioType
    });

    TestBed.configureTestingModule({
      providers: [
        providePortfolioServiceMock(),
        provideAssetServiceMock(),
        TransactionService,
        { provide: Router, useValue: routerMock },
        { provide: SourceService, useValue: sourceServiceMock },
      ]
    });

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
      assetsMock$.set({ 'NYSE:AAPL': mockAsset } as unknown as Record<string, AssetQuoteType>);
      spyOn(service as any, 'persistTransaction');
      
      // Act
      let result: InvestmentTransactionType | undefined;
      service.saveTransaction(mockTransaction).subscribe(transaction => {
        result = transaction;
      });
      
      // Assert
      expect(result).toEqual(mockTransaction);
      expect((service as any).persistTransaction).toHaveBeenCalledWith(mockTransaction, undefined);
    });

    // Test 2: should open a new dialog and save a transaction when the asset does not exist
    it('should open a new dialog and save a transaction when the asset does not exist', () => {
      // Arrange
      assetsMock$.set({});

      const newDialogOriginal = assetServiceMock.newDialog;

      // Mock that asset is added after dialog is closed
      const newDialog = assetServiceMock.newDialog.and.callFake(() => {
        assetsMock$.set({ 'NYSE:AAPL': mockAsset } as unknown as Record<string, AssetQuoteType>);
        newDialogOriginal.and.callThrough();
        return of(mockAsset as any);
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
      expect((service as any).persistTransaction).toHaveBeenCalledWith(mockTransaction, undefined);
    });

    // Test 3: should throw an error if the asset is not found after opening the dialog
    it('should throw an error if the asset is not found after opening the dialog', () => {
      // Arrange

      const newDialog = assetServiceMock.newDialog.and.returnValue(of({} as any));
      
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
      assetsMock$.set({ 'NYSE:AAPL': mockAsset } as unknown as Record<string, AssetQuoteType>);

      const allocations = { 'portfolio-1': 5, 'portfolio-2': 5 };
      spyOn(service as any, 'persistTransaction');
      
      // Act
      let result: InvestmentTransactionType | undefined;
      service.saveTransaction(mockTransaction, allocations).subscribe(transaction => {
        result = transaction;
      });
      
      // Assert
      expect(result).toEqual(mockTransaction);
      expect((service as any).persistTransaction).toHaveBeenCalledWith(mockTransaction, allocations);
    });

    // Test 5: should handle missing asset and open new asset dialog
    it('should handle missing asset and open new asset dialog', () => {
      // Arrange
      // Mock that asset is added after dialog is closed
      const updatedAssets = { 'NYSE:AAPL': { ...mockAsset, quote: { value: 210.50, currency: 'EUR' } } } as unknown as Record<string, AssetQuoteType>;

      spyOn(service as any, 'persistTransaction');
      
      const assetServiceSpy = TestBed.inject(AssetService) as jasmine.SpyObj<AssetService>;
      assetServiceSpy.newDialog.and.callFake(() => {
        assetsMock$.set(updatedAssets);
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

});
