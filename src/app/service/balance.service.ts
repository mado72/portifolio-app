import { inject, Injectable } from '@angular/core';
import { eachMonthOfInterval, getDate, getMonth, setDay } from 'date-fns';
import { forkJoin, map, Observable, of } from 'rxjs';
import allocations from '../../data/allocation.json';
import balances from '../../data/balance.json';
import statementForecast from '../../data/statement-forecast.json';
import { AccountBalanceExchange, AccountBalanceSummary, AccountBalanceSummaryItem, AccountPosition, AccountTypeEnum, Currency, currencyOf, Exchange, ForecastDateItem, ForecastDayItem, StatementEnum } from '../model/domain.model';
import { QuoteService } from './quote.service';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  private quoteService = inject(QuoteService);

  readonly balancesData = balances.data;

  readonly allocationsData = allocations.data;

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
   * Retrieves the balance quotation for each account position in the specified currency.
   * The balance quotation is calculated by multiplying the account balance with the exchange rate factor.
   *
   * @param currency - The target currency for the balance quotation calculation.
   *
   * @returns An Observable emitting an array of AccountBalanceQuote objects.
   * Each AccountBalanceQuote object contains the account position details and the calculated balance quotation.
   */
  getBalancesByCurrencyExchange(currency: Currency) {
    return forkJoin({
      acc: this.getAllBalances(),
      quotes: this.quoteService.getAllExchanges()
    }).pipe(
      map(balances => {
        return balances.acc.map(acc => {
          const quote = balances.quotes.find(c => c.from === acc.balance.currency && c.to === currency);
          return {
            ...acc,
            exchange: {
              amount: acc.balance.amount * (quote?.factor || 1),
              currency
            },
          } as AccountBalanceExchange;
        });
      })
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
   */
  getAllocationSummary(currency: Currency): Observable<AccountBalanceSummary> {
    return forkJoin({
      allocations: of(this.allocationsData),
      exchanges: this.quoteService.getAllExchanges()
    })
      .pipe(
        map(data => {
          const allocations = this.getAllocations(data, currency)
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
        })
      );
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
  protected getAllocations(data: { allocations: { class: string; financial: number; currency: string; percentagePlanned: number; }[]; exchanges: Exchange[]; }, currency: Currency) {
    return data.allocations.map(item => {
      const itemCurrency = currencyOf(item.currency);
      const quote = data.exchanges.find(c => c.from === itemCurrency && c.to === currency);
      return {
        class: item.class,
        financial: {
          amount: item.financial,
          currency: itemCurrency
        },
        exchange: {
          amount: item.financial * (quote?.factor || 1),
          currency
        },
        percentagePlanned: item.percentagePlanned,
        percentageActual: 0 // This should be calculated using total allocated amount
      } as AccountBalanceSummaryItem;
    });
  }

  getForecastSummary(currency: Currency): Observable<ForecastDayItem[]> {
    return forkJoin({
      statements: of(this.statementForecastData),
      exchanges: this.quoteService.getAllExchanges()
    }).pipe(
      map(data=> {
        const statements = data.statements.map(item=> {
          const quote = data.exchanges.find(c => c.from === currencyOf(item.currency) && c.to === currency);
          return {
            id: item.id,
            type: StatementEnum[item.type as keyof typeof StatementEnum],
            movement: item.movement,
            value: {
              amount: item.amount * (quote?.factor || 1),
              currency
            },
            day: item.date,
            done: item.date <= getDate(new Date()) // TODO should be defined by database query
          }
        });
        return statements;
      })
    );
  } 

  getCurrentMonthForecast(currency: Currency) {
    return this.getForecastSummary(currency);
  }

  getPeriodForecast(currency: Currency, start: Date, end: Date) {
    
    return this.getForecastSummary(currency).pipe(
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
}
