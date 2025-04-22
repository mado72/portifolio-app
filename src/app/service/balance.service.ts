import { computed, inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { addYears, areIntervalsOverlapping, endOfMonth, endOfYear, getDate, getTime, interval, Interval, isWithinInterval, max, min, setDate, startOfMonth, startOfYear } from 'date-fns';
import { map } from 'rxjs';
import { BalanceDialogComponent } from '../cashflow/balance-dialog/balance-dialog.component';
import { AccountBalanceExchange, AccountBalanceSummaryItem, AccountTypeEnum, Currency, ForecastDateItem, isTransactionDeposit, isTransactionExpense } from '../model/domain.model';
import { getScheduleDates, getZonedDate, groupBy, isSameZoneDate } from '../model/functions.model';
import { TransactionStatus } from '../model/investment.model';
import { BalanceType, ScheduledStatemetType, TransactionType } from '../model/source.model';
import { QuoteService } from './quote.service';
import { SourceService } from './source.service';
import { ExchangeService } from './exchange.service';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  private sourceService = inject(SourceService);

  private exchangeService = inject(ExchangeService);

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

  getAccounts = computed(() => Object.values(this.sourceService.balanceSource()).map(item=>({account: item.accountName, id: item.id as string})))

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
      const quoteFactor = this.exchangeService.getExchangeQuote(item.balance.currency, currency);
      return {
        ...item,
        exchange: {
          value: item.balance.value * quoteFactor,
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
      .map(item => item.exchange.value)
      .reduce((acc, vl) => acc += vl, 0)
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
            amount: group.reduce((acc, item) => acc - item.value.value, 0)
          }
          accSt.push(item);
          return accSt;
        }, [] as { start: number, end: number, amount: number }[])
        .sort((a,b)=>a.start-b.start);

    for (let i = 0; i < depositTransactions.length; i++) {
      summaryPeriod.splice((i * 2) + 1, 0, {
        start: getZonedDate(depositTransactions[i].date),
        end: getZonedDate(depositTransactions[i].date),
        amount: depositTransactions[i].value.value
      });
    }
    return summaryPeriod.sort((a,b)=>1000 * (a.start - b.start) + (a.end - b.end));

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
        const quoteFactor = this.exchangeService.getExchangeQuote(item.amount.currency, currency);
        const scheduledRange = interval(
          max([item.scheduled.startDate, setDate(dateRange.start, getZonedDate(item.scheduled.startDate))]),
          min([item.scheduled.endDate || endOfYear(new Date()), dateRange.end]));

        const dates = getScheduleDates(scheduledRange, dateRange, item.scheduled.type);
        const items: TransactionType[] = dates.map(date => ({
          ...item,
          id: undefined,
          date,
          value: {
            ...item.amount,
            amount: item.amount.value * quoteFactor
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
            currency: this.exchangeService.currencyDefault()
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
