import { inject, Injectable } from '@angular/core';
import { eachMonthOfInterval, getDate, getMonth, setDay } from 'date-fns';
import { map, Observable, of, tap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { AccountBalanceExchange, AccountBalanceSummary, AccountBalanceSummaryItem, AccountTypeEnum, Currency, ForecastDateItem, ForecastDayItem, isStatementExpense, StatementEnum } from '../model/domain.model';
import { groupBy } from '../model/functions.model';
import { BalanceType, ClassConsolidationType } from '../model/source.model';
import { QuoteService } from './quote.service';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  private sourceService = inject(SourceService);

  private quoteService = inject(QuoteService);

  constructor() { }

  /**
   * Retrieves all account balances from the source service.
   *
   * @returns An Observable emitting an array of AccountBalance objects,
   * each representing an account balance.
   *
   * @example
   * ```typescript
   * const balances = balanceService.getAllBalances();
   * balances.subscribe(balances => {
   *   console.log(balances);
   *   // Output: [AccountBalance, AccountBalance, ...] (example array of account balances)
   * });
   * ```
   */
  getAllBalances() {
    return this.sourceService.balanceSource();
  }



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
   *   //   ...AccountBalance,
   *   //   exchange: {
   *   //     amount: 1234.56,
   *   //     currency: Currency.USD
   *   //   }
   *   // }
   * });
   * ```
   */
  getBalancesByCurrencyExchange(currency: Currency) {
    return Object.values(this.getAllBalances()).map(item => {
      const quoteFactor = this.quoteService.getExchangeQuote(item.balance.currency, currency);
      return {
        ...item,
        exchange: {
          amount: item.balance.amount * quoteFactor,
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
  getBalancesSummarized(currency: Currency, excludeAccTypes: AccountTypeEnum[] = []) {
    return this.getBalancesByCurrencyExchange(currency)
      .filter(acc => !excludeAccTypes.includes(acc.type))
      .map(item => item.exchange.amount)
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
    const total = allocations.map(item => item.exchange.amount).reduce((acc, vl) => acc += vl, 0);

    const items: AccountBalanceSummaryItem[] = allocations.map(item => {
      return {
        ...item,
        percentageActual: item.exchange.amount / total
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
    const statements = this.getRecurringStatements(currency);

    const depositStatements = statements.filter(statement => !isStatementExpense(statement.type));

    const mapPeriods: number[][] = [];
    let initialDate = 1;
    depositStatements.forEach((depositStatement) => {
      const day = depositStatement.day;
      mapPeriods.push([initialDate, day]);
      initialDate = day + 1;
    });
    mapPeriods.push([initialDate, 31]);

    const expensePeriods = groupBy(statements, (statement) => {
      return (mapPeriods.find(period => period[0] <= statement.day && statement.day <= period[1]) || [])
    });
    const summaryPeriod = Array.from(
      expensePeriods
        .entries()).reduce((accSt, [period, group]) => {
          const item = {
            start: period[0],
            end: period[1],
            amount: group.reduce((acc, item) => acc - item.value.amount, 0)
          }
          accSt.push(item);
          return accSt;
        }, [] as { start: number, end: number, amount: number }[]);

    for (let i = 0; i < depositStatements.length; i++) {
      summaryPeriod.splice((i * 2) + 1, 0, {
        start: depositStatements[i].day,
        end: depositStatements[i].day,
        amount: depositStatements[i].value.amount
      });
    }
    return summaryPeriod;
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
          amount: item.financial.amount * quoteFactor,
          currency
        },
        percentageActual: 0 // This should be calculated using total allocated amount
      } as AccountBalanceSummaryItem;
    });
  }


  // FIXME: This method should be refactored to include database query.
  getRecurringStatements(currency: Currency): ForecastDayItem[] {
    const statements = Object.values(this.sourceService.statementSource());

    return statements.map(item => {
      const quoteFactor = this.quoteService.getExchangeQuote(item.value.currency, currency)
      return {
        id: item.id,
        type: StatementEnum[item.type as keyof typeof StatementEnum],
        movement: item.movement,
        value: {
          amount: item.value.amount * quoteFactor,
          currency
        },
        day: item.date,
        done: item.date <= getDate(new Date()) // TODO: should be defined by database query
      }
    })
  }


  getCurrentMonthForecast(currency: Currency) {
    return this.getRecurringStatements(currency);
  }

  getPeriodForecast(currency: Currency, start: Date, end: Date) {

    const statements = this.getRecurringStatements(currency);

    const months = eachMonthOfInterval({ start, end });
    // MOCK logic
    const result: ForecastDateItem[] = [];

    // TODO: Implement real logic to calculate forecast for each month
    for (var i = 0; i < months.length; i++) {
      result.push(...statements.map(item => ({
        ...item,
        date: setDay(getDate(months[i]), item.day),
        done: getMonth(months[i]) === getMonth(start) && item.day < getDate(new Date()) // TODO should be defined by database query
      })))
    }

    return result;
  }

  addAccount(account: BalanceType) {
    this.sourceService.addBalance(account);
  }

  updateAccount(id: string, result: BalanceType) {
    this.sourceService.updateBalance([result]);
  }

}
