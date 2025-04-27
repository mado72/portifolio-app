import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { InvestmentTransactionsControlComponent } from './investment-transactions-control.component';
import { TransactionService } from '../../service/transaction.service';
import { InvestmentTransactionType } from '../../model/source.model';
import { InvestmentTransactionFormResult } from '../investment-transaction-form/investment-transaction-form.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Currency, TransactionEnum } from '../../model/domain.model';
import { InvestmentEnum, TransactionStatus } from '../../model/investment.model';
import { signal } from '@angular/core';

describe('InvestmentTransactionsControlComponent', () => {
  let component: InvestmentTransactionsControlComponent;
  let fixture: ComponentFixture<InvestmentTransactionsControlComponent>;
  let transactionServiceMock: jasmine.SpyObj<TransactionService>;
  let activatedRouteMock: any;
  let formDataSignal: any;

  const mockAllocations = [
    { id: 'portfolio-1', name: 'Portfolio 1', qty: 5 },
    { id: 'portfolio-2', name: 'Portfolio 2', qty: 5 }
  ];

  // Mock data
  const mockTransaction: InvestmentTransactionFormResult = {
    id: 'transaction-1',
    ticker: 'NYSE:AAPL',
    date: new Date('2025-04-19'),
    accountId: 'account-1',
    quote: 200.50,
    value: { value: 2005, currency: Currency.USD },
    status: TransactionStatus.COMPLETED,
    quantity: 10,
    type: InvestmentEnum.BUY,
    fees: 5.99,
    allocations: mockAllocations
  };

  const mockAllocationsByTransaction = {
    'transaction-1': [
      { portfolioId: 'portfolio-1', portfolioName: 'Portfolio 1', quantity: 5 },
      { portfolioId: 'portfolio-2', portfolioName: 'Portfolio 2', quantity: 5 }
    ]
  };

  beforeEach(async () => {
    // Create spy objects for services
    transactionServiceMock = jasmine.createSpyObj('TransactionService', [
      'createTransactionAllocations',
      'investmentTransactions',
      'allocationByTransactions',
      'createTransaction',
      'editTransaction',
      'deleteTransaction',
      'saveTransaction',
      'listTransactions'
    ]);

    // Configure mock return values
    transactionServiceMock.createTransactionAllocations.and.returnValue(mockAllocations);
    transactionServiceMock.investmentTransactions.and.returnValue({[mockTransaction.id]: mockTransaction});
    transactionServiceMock.allocationByTransactions.and.returnValue(mockAllocationsByTransaction);
    transactionServiceMock.saveTransaction.and.returnValue(of({} as InvestmentTransactionType));

    // Configure ActivatedRoute mock
    activatedRouteMock = {
      snapshot: {
        data: { action: '' },
        paramMap: {
          get: jasmine.createSpy('get')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [InvestmentTransactionsControlComponent],
      providers: [
        { provide: TransactionService, useValue: transactionServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InvestmentTransactionsControlComponent);
    component = fixture.componentInstance;
    formDataSignal = signal(null);
    component['formData'] = formDataSignal;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form data for "create" action', () => {
      // Arrange
      activatedRouteMock.snapshot.data.action = 'create';

      // Act
      component.ngOnInit();

      // Assert
      expect(transactionServiceMock.createTransactionAllocations).toHaveBeenCalled();
      expect(component.formData()).toEqual({
        quantity: 0,
        allocations: mockAllocations
      });
    });

    it('should initialize form data for "edit" action with valid transaction ID', () => {
      // Arrange
      activatedRouteMock.snapshot.data.action = 'edit';
      activatedRouteMock.snapshot.paramMap.get.and.returnValue('transaction-1');

      // Act
      component.ngOnInit();

      // Assert
      expect(transactionServiceMock.investmentTransactions).toHaveBeenCalled();
      expect(transactionServiceMock.allocationByTransactions).toHaveBeenCalled();
      expect(component.formData()).toEqual({
        ...mockTransaction,
        marketPlace: 'NYSE',
        code: 'AAPL',
        allocations: [
          { id: 'portfolio-1', name: 'Portfolio 1', qty: 5 },
          { id: 'portfolio-2', name: 'Portfolio 2', qty: 5 }
        ]
      });
    });

    it('should handle "edit" action with invalid transaction ID', () => {
      // Arrange
      activatedRouteMock.snapshot.data.action = 'edit';
      activatedRouteMock.snapshot.paramMap.get.and.returnValue('non-existent-id');
      formDataSignal.set(null); // Reset form data

      // Act
      debugger;
      component.ngOnInit();

      // Assert
      expect(transactionServiceMock.investmentTransactions).toHaveBeenCalled();
      expect(component.formData()).toBeNull();
    });

    it('should handle "edit" action with no transaction ID', () => {
      // Arrange
      activatedRouteMock.snapshot.data.action = 'edit';
      activatedRouteMock.snapshot.paramMap.get.and.returnValue(null);

      // Act
      debugger;
      component.ngOnInit();

      // Assert
      expect(component.formData()).toBeNull();
    });

    it('should not set form data for unknown action', () => {
      // Arrange
      activatedRouteMock.snapshot.data.action = 'unknown';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.formData()).toBeNull();
    });
  });

  describe('addTransaction', () => {
    it('should call createTransaction on the transaction service', () => {
      // Act
      component.addTransaction();

      // Assert
      expect(transactionServiceMock.createTransaction).toHaveBeenCalled();
    });
  });

  describe('editTransaction', () => {
    it('should call editTransaction on the transaction service with the correct ID', () => {
      // Act
      component.editTransaction(mockTransaction);

      // Assert
      expect(transactionServiceMock.editTransaction).toHaveBeenCalledWith('transaction-1');
    });
  });

  describe('onDeleteItem', () => {
    it('should call deleteTransaction on the transaction service with the correct ID', () => {
      // Act
      component.onDeleteItem('transaction-1');

      // Assert
      expect(transactionServiceMock.deleteTransaction).toHaveBeenCalledWith('transaction-1');
    });
  });

  describe('onSaveTransaction', () => {
    it('should reset form data, save transaction and list transactions', () => {
      // Arrange
      const mockFormResult: InvestmentTransactionFormResult = {
        id: 'transaction-1',
        ticker: 'NYSE:AAPL',
        date: new Date('2025-04-19'),
        accountId: 'account-1',
        quote: 200.50,
        value: { value: 2005, currency: Currency.USD },
        status: TransactionStatus.COMPLETED,
        quantity: 10,
        type: InvestmentEnum.BUY,
        fees: 5.99,
        allocations: mockAllocations
      };
    
      // Act
      component.onSaveTransaction(mockFormResult);

      // Assert
      expect(component.formData()).toBeNull();
      expect(transactionServiceMock.saveTransaction).toHaveBeenCalledWith(mockFormResult, {"portfolio-1": 5, "portfolio-2": 5});
      expect(transactionServiceMock.listTransactions).toHaveBeenCalled();
    });
  });

  describe('onCancelTransactionForm', () => {
    it('should call listTransactions on the transaction service', () => {
      // Act
      component.onCancelTransactionForm();

      // Assert
      expect(transactionServiceMock.listTransactions).toHaveBeenCalled();
    });
  });
});
