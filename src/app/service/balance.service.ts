import { computed, inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { addYears, areIntervalsOverlapping, endOfMonth, endOfYear, getDate, getTime, interval, Interval, isWithinInterval, max, min, setDate, startOfMonth, startOfYear } from 'date-fns';
import { map } from 'rxjs';
import { AccountBalanceExchange, AccountBalanceSummary, AccountBalanceSummaryItem, AccountTypeEnum, Currency, ForecastDateItem, isTransactionDeposit, isTransactionExpense } from '../model/domain.model';
import { getScheduleDates, getZonedDate, groupBy, isSameZoneDate } from '../model/functions.model';
import { BalanceType, ClassConsolidationType, ScheduledStatemetType, TransactionType } from '../model/source.model';
import { BalanceDialogComponent } from '../cashflow/balance-dialog/balance-dialog.component';
import { QuoteService } from './quote.service';
import { SourceService } from './source.service';
import { TransactionStatus } from '../model/investment.model';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  private sourceService = inject(SourceService);

  private quoteService = inject(QuoteService);

  private dialog = inject(MatDialog);

  constructor() { }

  /**
   * Retrieves all account balances from the source service.
   *
   * @returns An Observable emitting an array of BalanceType objects,
   * each representing an account balance.
   *
   * @example
   * ```typescript
   * const balances = balanceService.getAllBalances();
   * balances.subscribe(balances => {
   *   console.log(balances);
   *   // Output: [BalanceType, BalanceType, ...] (example array of account balances)
   * });
   * ```
   */
  getAllBalances = computed(()=> {
    return this.sourceService.balanceSource();
  })

  /**
   * Retrieves all account balances and calculates the balance quotation in the specified currency.
   *
   * @param currency - The target currency for the balance quotation calculation.
   *
   * @returns An array of AccountBalanceExchange objects. Each AccountBalanceExchange object represents
   * an account balance with its corresponding exchange amount and currency.
   *
   * @example
   * ```typescript
   * const balances = balanceService.getBalancesByCurrencyExchange(Currency.USD);
   * balances.forEach(balance => {
   *   console.log(balance);
   *   // Output:
   *   // {
   *   //   ...BalanceType,
   *   //   exchange: {
   *   //     amount: 1234.56,
   *   //     currency: Currency.USD
   *   //   }
   *   // }
   * });
   * ```
   */
  getBalancesByCurrencyExchange(balances: BalanceType[], currency: Currency): AccountBalanceExchange[] {
    return balances.map(item => {
      const quoteFactor = this.quoteService.getExchangeQuote(item.balance.currency, currency);
      return {
        ...item,
        exchange: {
          price: item.balance.price * quoteFactor,
          currency
        },
      } as AccountBalanceExchange;
    });
  }


  /**
   * Retrieves the summarized balance amount for all accounts, excluding specific account types,
   * and calculates the balance quotation in the specified currency.
   *
   * @param currency - The target currency for the balance quotation calculation.
   * @param excludeAccTypes - An optional array of account types to exclude from the summary.
   *
   * @returns The total balance amount in the specified currency, excluding the specified account types.
   *
   * @example
   * ```typescript
   * const totalBalance = balanceService.getBalancesSummarized(Currency.USD, [AccountTypeEnum.SAVINGS]);
   * console.log(totalBalance);
   * // Output: 12345.67 (example total balance amount)
   * ```
   */
  getBalancesSummarized(balances: BalanceType[], currency: Currency, excludeAccTypes: AccountTypeEnum[] = []): number {
    return this.getBalancesByCurrencyExchange(balances, currency)
      .filter(acc => !excludeAccTypes.includes(acc.type))
      .map(item => item.exchange.price)
      .reduce((acc, vl) => acc += vl, 0)
  }


  /**
   * Retrieves a summary of account allocations, including the exchange amount and currency,
   * and calculates the percentage of each allocation relative to the total allocation amount.
   *
   * @param currency - The target currency for the allocation summary calculation.
   *
   * @returns An AccountBalanceSummary object containing an array of AccountBalanceSummaryItem objects
   * and the total allocation amount in the specified currency.
   *
   * @example
   * ```typescript
   * const currency = Currency.USD;
   * const allocationSummary = balanceService.getAllocationSummary(currency);
   * console.log(allocationSummary);
   * // Output:
   * // {
   * //   items: [
   * //     { ...AccountBalanceSummaryItem, percentageActual: 0.25 },
   * //     { ...AccountBalanceSummaryItem, percentageActual: 0.50 },
   * //     { ...AccountBalanceSummaryItem, percentageActual: 0.25 },
   * //   ],
   * //   total: 10000.00
   * // }
   * ```
   */
  getAllocationSummary(currency: Currency): AccountBalanceSummary {
    const allocations = this.getAllocations(Object.values(this.sourceService.classConsolidationSource()), currency);
    const total = allocations.map(item => item.exchange.price).reduce((acc, vl) => acc += vl, 0);

    const items: AccountBalanceSummaryItem[] = allocations.map(item => {
      return {
        ...item,
        percentageActual: item.exchange.price / total
      }
    });

    return {
      items,
      total
    };
  }


  /**
   * Retrieves a summary of forecasted income and expenses for the current month,
   * grouped by periods and calculated in the specified currency.
   *
   * @param currency - The target currency for the forecast summary calculation.
   *
   * @returns An array of objects, each representing a forecasted period.
   * Each object contains the start and end days of the period and the forecasted amount.
   *
   * @example
   * ```typescript
   * const currency = Currency.USD;
   * const forecastSummary = balanceService.getForecastSummary(currency);
   * console.log(forecastSummary);
   * // Output:
   * // [
   * //   { start: 1, end: 15, amount: -500.00 },
   * //   { start: 16, end: 16, amount: 1000.00 },
   * //   { start: 17, end: 31, amount: -500.00 },
   * // ]
   * ```
   */
  getForecastSummary(currency: Currency): { start: number, end: number, amount: number }[] {
    const scheduleds = this.getForecastTransactions(currency, new Date(), "month")
        .filter(item=> ![TransactionStatus.COMPLETED].includes(item.status))

    const depositTransactions = scheduleds.filter(transaction => isTransactionDeposit(transaction.type));

    const mapPeriods: number[][] = extractIntervalsOfDeposits(depositTransactions);

    const expensesPeriods = groupBy(scheduleds.filter(transaction => isTransactionExpense(transaction.type)), 
      (transaction) => {
        const day = getZonedDate(transaction.date);
        return (mapPeriods.find(period => period[0] <= day && day <= period[1]) || [])
      });
    const summaryPeriod = Array.from(
      expensesPeriods
        .entries()).reduce((accSt, [period, group]) => {
          const item = {
            start: period[0],
            end: period[1],
            amount: group.reduce((acc, item) => acc - item.value.amount, 0)
          }
          accSt.push(item);
          return accSt;
        }, [] as { start: number, end: number, amount: number }[])
        .sort((a,b)=>a.start-b.start);

    for (let i = 0; i < depositTransactions.length; i++) {
      summaryPeriod.splice((i * 2) + 1, 0, {
        start: getZonedDate(depositTransactions[i].date),
        end: getZonedDate(depositTransactions[i].date),
        amount: depositTransactions[i].value.amount
      });
    }
    return summaryPeriod;

    function extractIntervalsOfDeposits(depositTransactions: TransactionType[]): number[][] {
      depositTransactions = depositTransactions.sort((a,b)=>getTime(a.date)-getTime(b.date))
      const intervals: number[][] = [];
      let initialDate = 1;

      for (const { date } of depositTransactions) {
        const day = getZonedDate(date);
        intervals.push([initialDate, day]);
        initialDate = day + 1;
      }

      intervals.push([initialDate, getDate(endOfMonth(new Date()))]);
      return intervals;
    }
  }



  /**
   * Maps the allocation data to AccountBalanceSummaryItem objects,
   * calculates the value in the specified currency, and determine the percentageActual to 0.
   *
   * @param data - An object containing allocations and exchanges data.
   * @param data.allocations - An array of allocation data.
   * @param data.exchanges - An array of exchange data.
   * @param currency - The target currency for the value calculation.
   *
   * @returns An array of AccountBalanceSummaryItem objects.
   */
  protected getAllocations(allocations: ClassConsolidationType[], currency: Currency) {
    return allocations.map(item => {
      const quoteFactor = this.quoteService.getExchangeQuote(item.financial.currency, currency);
      return {
        ...item,
        exchange: {
          price: item.financial.price * quoteFactor,
          currency
        },
        percentageActual: 0 // This should be calculated using total allocated amount
      } as AccountBalanceSummaryItem;
    });
  }

  generateForecastTransactions(currency: Currency, dateRef: Date, period: "month" | "year"): TransactionType[] {
    const fnIntervalScheduled = (item: ScheduledStatemetType): Interval => ({
      start: item.scheduled.startDate,
      end: item.scheduled.endDate || endOfYear(addYears(dateRef, 100))
    })

    const dateRange = this.getDateRange(period, dateRef)
    const scheduledTransactions = Object.values(this.sourceService.scheduledSource());

    return scheduledTransactions
      .filter(item => areIntervalsOverlapping(dateRange, fnIntervalScheduled(item)))
      .flatMap(item => {
        const quoteFactor = this.quoteService.getExchangeQuote(item.value.currency, currency);
        const scheduledRange = interval(
          max([item.scheduled.startDate, setDate(dateRange.start, getZonedDate(item.scheduled.startDate))]),
          min([item.scheduled.endDate || endOfYear(new Date()), dateRange.end]));

        const dates = getScheduleDates(scheduledRange, dateRange, item.scheduled.type);
        const items: TransactionType[] = dates.map(date => ({
          ...item,
          id: undefined,
          date,
          value: {
            ...item.value,
            amount: item.value.amount * quoteFactor
          },
          status: TransactionStatus.PROGRAMING,
          scheduledRef: item.id,
        }));
        return items;
      })
  }

  private getDateRange(period: string, dateRef: Date) {
    return interval(
      period === "month" ? startOfMonth(dateRef) : startOfYear(dateRef),
      period === "month" ? endOfMonth(dateRef) : endOfYear(dateRef)
    );
  }

  getForecastTransactions(currency: Currency, dateRef: Date, period: "month" | "year"): TransactionType[] {
    const dateRange = this.getDateRange(period, dateRef);
    const futureTransactions = this.generateForecastTransactions(currency, dateRef, period);
    const transactions = Object.values(this.sourceService.cashflowSource())
      .filter(transaction => isWithinInterval(transaction.date, dateRange));

    const combinedTransactions = [ ...transactions, ...futureTransactions];
    return combinedTransactions
      .filter((transaction, index, self) =>
        index === self.findIndex((t) => (
          t.scheduledRef === transaction.scheduledRef 
          && isSameZoneDate(t.date, transaction.date)
        )))
  }

  getCurrentMonthForecast(currency: Currency): ForecastDateItem[] {
    return this.getForecastTransactions(currency, new Date(), "month").map(item => ({
      ...item,
      done: !! item.id && [TransactionStatus.COMPLETED, TransactionStatus.PENDING].includes(item.status)
    }))
  }

  addAccount(account: BalanceType) {
    return this.sourceService.addBalance(account);
  }

  updateAccount(id: string, result: BalanceType) {
    return this.sourceService.updateBalance([{
      ...result,
      id
    }])[0];
  }

  newAccount() {
    const dialogRef = this.dialog.open(BalanceDialogComponent, {
      data: {
        title: 'Nova Conta',
        account: {
          accountName: '',
          type: AccountTypeEnum.CHECKING,
          balance: {
            price: 0,
            currency: this.sourceService.currencyDefault()
          },
          date: new Date()
        }
      }
    });

    return this.processDialog(dialogRef);
  }

  editAccount(account: AccountBalanceExchange) {
    const dialogRef = this.dialog.open(BalanceDialogComponent, {
      data: {
        title: 'Editar Conta',
        account
      }
    });

    return this.processDialog(dialogRef);
  }

  protected processDialog(dialogRef: MatDialogRef<BalanceDialogComponent, any>) {
    return dialogRef.afterClosed().pipe(
      map((result: AccountBalanceExchange) => {
        if (result) {
          let account = this.sourceService.balanceSource()[result?.id as string];
          if (!account) {
            return this.addAccount(result);
          }
          else {
            return this.updateAccount(account.id as string, {
              ...account,
              ...result
            });
          }
        }
        return undefined;
      })
    );
  }

  deleteAccount(id: string) {
    this.sourceService.deleteBalance(id);
  }

  addTransaction(transaction: TransactionType) {
    return this.sourceService.addCashflowTransaction(transaction);
  }

  updateTransaction(id: string, transaction: TransactionType) {
    return this.sourceService.updateCashflowTransaction([{
      ...transaction,
      id
    }])[0];
  }
}
