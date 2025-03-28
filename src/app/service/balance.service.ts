import { inject, Injectable } from '@angular/core';
import { eachMonthOfInterval, getDate, getMonth, setDay } from 'date-fns';
import { forkJoin, map, Observable, of, tap } from 'rxjs';
import allocationsSource from '../../data/allocation.json';
import balancesSource from '../../data/balance.json';
import statementForecast from '../../data/statement-forecast.json';
import { AccountBalanceExchange, AccountBalanceSummary, AccountBalanceSummaryItem, AccountPosition, AccountTypeEnum, Currency, currencyOf, Exchange, ForecastDateItem, ForecastDayItem, isStatementExpense, StatementEnum } from '../model/domain.model';
import { QuoteService } from './quote.service';
import { groupBy } from '../model/functions.model';
import { v4 as uuid }  from 'uuid';

type BalanceDataType = {
  id: string;
  account: string;
  balance: number;
  currency: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  private quoteService = inject(QuoteService);

  readonly balancesData = balancesSource.data as BalanceDataType[];

  readonly allocationsData = allocationsSource.data;

  readonly statementForecastData = statementForecast.data;

  constructor() { }

  /**
   * Retrieves all account positions from the balances data.
   *
   * @returns An Observable emitting an array of AccountPosition objects.
   * Each AccountPosition object represents an account with its balance, currency, and type.
   */
  getAllBalances(): Observable<AccountPosition[]> {
    return of(this.balancesData.map((item: any) => ({
      ...item,
      balance: {
        amount: item.balance,
        currency: item.currency as keyof typeof Currency
      },
      type: item.type as keyof typeof AccountTypeEnum
    } as AccountPosition)));
  }

  /**
   * Retrieves account balances and calculates their quotation in the specified currency.
   *
   * @param currency - The target currency for the balance quotation calculation.
   *
   * @returns An Observable emitting an array of AccountBalanceExchange objects.
   * Each AccountBalanceExchange object represents an account with its balance, currency, type,
   * and the calculated exchange amount in the specified currency.
   *
   * @example
   * ```typescript
   * const currency = Currency.USD;
   * const balancesByCurrency = balanceService.getBalancesByCurrencyExchange(currency);
   * balancesByCurrency.subscribe(balances => {
   *   console.log(balances);
   *   // Output: [
   *   //   { account: 'Account 1', balance: { amount: 1000, currency: Currency.EUR }, type: AccountTypeEnum.CHECKING, exchange: { amount: 1100, currency: Currency.USD } },
   *   //   { account: 'Account 2', balance: { amount: 2000, currency: Currency.GBP }, type: AccountTypeEnum.SAVINGS, exchange: { amount: 2200, currency: Currency.USD } },
   *   // ]
   * });
   * ```
   */
  getBalancesByCurrencyExchange(currency: Currency) {
    return this.getAllBalances().pipe(
      map(balances => {
        return balances.map(acc => {
          const quoteFactor = this.quoteService.getExchangeQuote(acc.balance.currency, currency);
          return {
            ...acc,
            exchange: {
              amount: acc.balance.amount * quoteFactor,
              currency
            },
          } as AccountBalanceExchange;
        });
      })
    );
  }


  /**
   * Retrieves the total balance amount for all account positions, excluding the specified account types,
   * and calculates the balance quotation in the specified currency.
   *
   * @param currency - The target currency for the balance quotation calculation.
   * @param excludeAccTypes - An optional array of account types to exclude from the balance calculation.
   *
   * @returns An Observable emitting the total balance amount in the specified currency,
   * after excluding the specified account types.
   *
   * @example
   * ```typescript
   * const currency = Currency.USD;
   * const excludeAccTypes = [AccountTypeEnum.SAVINGS, AccountTypeEnum.CREDIT_CARD];
   * const totalBalance = balanceService.getBalancesSummarized(currency, excludeAccTypes);
   * totalBalance.subscribe(balance => {
   *   console.log(balance);
   *   // Output: 12345.67 (example balance amount)
   * });
   * ```
   */
  getBalancesSummarized(currency: Currency, excludeAccTypes: AccountTypeEnum[] = []) {
    return this.getBalancesByCurrencyExchange(currency).pipe(
      map(balances => balances.filter(acc => !excludeAccTypes.includes(acc.type))
          .map(item => item.exchange.amount)
          .reduce((acc, vl) => acc += vl, 0)
      )
    )
  }


  /**
   * Retrieves a summary of account allocations based on the provided currency.
   * The summary includes the allocation class, financial amount, value in the specified currency,
   * planned percentage, and calculated percentageActual.
   *
   * @param currency - The target currency for the value calculation.
   *
   * @returns An Observable emitting an AccountBalanceSummary object.
   * The AccountBalanceSummary object contains an array of AccountBalanceSummaryItem objects,
   * representing each allocation. Each AccountBalanceSummaryItem object includes the allocation class,
   * financial amount, value in the specified currency, planned percentage, and calculated percentageActual.
   * Additionally, the AccountBalanceSummary object includes a total property representing the total value
   * of all allocations in the specified currency.
   *
   * @example
   * ```typescript
   * const currency = Currency.USD;
   * const allocationSummary = balanceService.getAllocationSummary(currency);
   * allocationSummary.subscribe(summary => {
   *   console.log(summary);
   *   // Output:
   *   // {
   *   //   items: [
   *   //     { class: 'Allocation 1', financial: { amount: 1000, currency: Currency.EUR }, exchange: { amount: 1100, currency: Currency.USD }, percentagePlanned: 0.5, percentageActual: 0.45454545454545453 },
   *   //     { class: 'Allocation 2', financial: { amount: 2000, currency: Currency.GBP }, exchange: { amount: 2200, currency: Currency.USD }, percentagePlanned: 0.5, percentageActual: 0.9090909090909091 },
   *   //   ],
   *   //   total: 3300
   *   // }
   * });
   * ```
   */
  getAllocationSummary(currency: Currency): Observable<AccountBalanceSummary> {
    return of(this.getAllocations({allocations: this.allocationsData}, currency)).pipe(
      map(allocations=> {
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
    }));
  }


  
  /**
   * Retrieves a summary of forecasted income and expenses for the current year, grouped by periods.
   * The summary includes the start and end days of each period, and the net amount for that period.
   *
   * @param currency - The target currency for the forecast calculation.
   *
   * @returns An Observable emitting an array of objects, each representing a forecasted period.
   * Each object contains the start and end days of the period, and the net amount for that period.
   *
   * @example
   * ```typescript
   * const currency = Currency.USD;
   * const forecastSummary = balanceService.getForecastSummary(currency);
   * forecastSummary.subscribe(summary => {
   *   console.log(summary);
   *   // Output:
   *   // [
   *   //   { start: 1, end: 15, amount: -100 },
   *   //   { start: 16, end: 16, amount: 200 },
   *   //   { start: 17, end: 31, amount: -150 },
   *   // ]
   * });
   * ```
   */
  getForecastSummary(currency: Currency): Observable<{start: number, end: number, amount: number}[]>{
    return this.getRecurringStatements(currency).pipe(
      map(statements => {
        const depositStatements = statements.filter(statement => !isStatementExpense(statement.type));

        const mapPeriods : number[][] = [];
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
          .entries()).reduce((accSt, [period, group])=>{
            const item = {
              start: period[0],
              end: period[1],
              amount: group.reduce((acc, item) => acc - item.value.amount, 0)
            }
            accSt.push(item);
            return accSt;
          }, [] as {start: number, end: number, amount: number}[]);

        for (let i = 0; i < depositStatements.length; i++) {
          summaryPeriod.splice((i*2)+1, 0, {
            start: depositStatements[i].day,
            end: depositStatements[i].day,
            amount: depositStatements[i].value.amount
          });
        }
        return summaryPeriod;
      })
    )
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
  protected getAllocations(data: { allocations: { class: string; financial: number; currency: string; percentagePlanned: number; }[] }, currency: Currency) {
    return data.allocations.map(item => {
      const itemCurrency = currencyOf(item.currency);
      const quoteFactor = this.quoteService.getExchangeQuote(itemCurrency, currency);
      return {
        class: item.class,
        financial: {
          amount: item.financial,
          currency: itemCurrency
        },
        exchange: {
          amount: item.financial * quoteFactor,
          currency
        },
        percentagePlanned: item.percentagePlanned,
        percentageActual: 0 // This should be calculated using total allocated amount
      } as AccountBalanceSummaryItem;
    });
  }

  
  // FIXME: This method should be refactored to include database query.
  getRecurringStatements(currency: Currency): Observable<ForecastDayItem[]> {
    return of(this.statementForecastData).pipe(
      map(statements => statements.map(item=> {
        const quoteFactor = this.quoteService.getExchangeQuote(currencyOf(item.currency), currency)
        return {
          id: item.id,
          type: StatementEnum[item.type as keyof typeof StatementEnum],
          movement: item.movement,
          value: {
            amount: item.amount * quoteFactor,
            currency
          },
          day: item.date,
          done: item.date <= getDate(new Date()) // TODO: should be defined by database query
        }
      }))
    );
  }


  getCurrentMonthForecast(currency: Currency) {
    return this.getRecurringStatements(currency);
  }

  getPeriodForecast(currency: Currency, start: Date, end: Date) {
    
    return this.getRecurringStatements(currency).pipe(
      map(statements => {
        // MOCK logic
        const months = eachMonthOfInterval({start, end});
        const result: ForecastDateItem[] = [];
        // TODO: Implement real logic to calculate forecast for each month
        for (var i = 0; i < months.length; i++) {
          result.push(... statements.map(item=> ({
            ...item,
            date: setDay(getDate(months[i]), item.day),
            done: getMonth(months[i]) === getMonth(start) && item.day < getDate(new Date()) // TODO should be defined by database query
          })))
        }
        return result;
      })
    );

  }

  addAccount(account: AccountPosition) : Observable<BalanceDataType>{
    const data = {
      id: uuid(),
      account: account.account,
      type: account.type,
      balance: account.balance.amount,
      currency: account.balance.currency
    };

    return of(data).pipe(
      tap(data => this.balancesData.push(data))
    )
  }

  updateAccount(id: string, result: AccountPosition) : Observable<void>{
    const idx = this.balancesData.findIndex(account => account.id === id);
    let account = {
      ...this.balancesData[idx],
      account: result.account,
      type: result.type,
      balance: result.balance.amount,
      currency: result.balance.currency
    }
    return of(account).pipe( 
      map(account => {
        this.balancesData[idx] = account
      })
    );
  }

}
