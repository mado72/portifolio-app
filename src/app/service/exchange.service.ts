import { computed, effect, inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { ExchangeStructureType, ExchangeView } from '../model/investment.model';
import { RemoteQuotesService } from './remote-quotes.service';
import { CurrencyPipe } from '@angular/common';
import { Currency, CurrencyType } from '../model/domain.model';
import { SourceService } from './source.service';
import { endOfMonth, getMonth, getYear } from 'date-fns';
import { CoinService } from './coin-remote.service';

const ExchangeServiceFactory = (remoteQuotesService: RemoteQuotesService) => {
  return new ExchangeService(remoteQuotesService);
}

export const provideExchangeService = () => ({
  provide: ExchangeService,
  useFactory: ExchangeServiceFactory,
  deps: [RemoteQuotesService]
})

export type ExchangeReq = {
  from: CurrencyType,
  to: CurrencyType
}

export type ExchangeType = ExchangeReq & {
  factor?: number
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  private sourceService = inject(SourceService);

  private coinService = inject(CoinService);

  readonly exchangeView = signal<ExchangeView>("original");

  private currencyPipe = new CurrencyPipe(inject(LOCALE_ID));

  readonly currencyDefault = signal<Currency>(Currency.BRL);

  readonly exchanges = computed(() => this.remoteQuotesService.exchanges());

  constructor(private remoteQuotesService: RemoteQuotesService) { 
    effect(() => {
      if (this.sourceService.dataIsLoaded()) {
        this.initializeExchangesDataHistory();
      }
    });
  }
  
  initializeExchangesDataHistory() {
    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    const exchangesPerYear = this.sourceService.dataSource.exchanges();

    if (!exchangesPerYear[currentYear]) {
      exchangesPerYear[currentYear] = {};
    }

    if (!exchangesPerYear[currentYear][Currency.USD]) {
      exchangesPerYear[currentYear][Currency.USD] = {};
    }

    if (!exchangesPerYear[currentYear][Currency.USD][Currency.BRL]) {
      exchangesPerYear[currentYear][Currency.USD][Currency.BRL] = [];
    }

    if (currentMonth > exchangesPerYear[currentYear][Currency.USD][Currency.BRL].length) {
      const startMonth = exchangesPerYear[currentYear][Currency.USD][Currency.BRL].length;
      const startDate = endOfMonth(new Date(currentYear, startMonth, 1));
      const endDate = new Date();

      this.coinService.getExchangesHistory(startDate, endDate).subscribe((exchanges) => {
        Object.entries(exchanges).forEach(([fromCurrency, toRates]) => {
          if (!exchangesPerYear[currentYear][fromCurrency as CurrencyType]) {
            exchangesPerYear[currentYear][fromCurrency as CurrencyType] = {};
          }

          Object.entries(toRates).forEach(([toCurrency, rates]) => {
            if (!exchangesPerYear[currentYear][fromCurrency as CurrencyType][toCurrency as CurrencyType]) {
              exchangesPerYear[currentYear][fromCurrency as CurrencyType][toCurrency as CurrencyType] = [];
            }

            // Append the new rates to the existing array
            exchangesPerYear[currentYear][fromCurrency as CurrencyType][toCurrency as CurrencyType].push(...rates);
          });
        });

        // Update the source service with the new exchanges data
        this.sourceService.dataSource.exchanges.set(exchangesPerYear);
      });
    }
  }

  toggleExchangeView() {
    this.exchangeView.update(exchangeView => (exchangeView === "original" ? "exchanged" : "original"));
  }

  getExchangeQuote(from: Currency, to: Currency) {
    const exchanges = this.exchanges();
    return exchanges[to]?.[from];
  }

  exchange(value: number, from: Currency, to: Currency) {
    return ({
      currency: to,
      value: value * this.getExchangeQuote(from, to)
    });
  }

  currencyToSymbol(currency: Currency | string): string {
    const result = this.currencyPipe.transform(1, currency, "symbol", "1.0")?.replace(/\d/, '');
    return result || currency;
  }

  updateExchange(exchange: ExchangeStructureType): ExchangeStructureType {
    const from = exchange.original.currency;
    const to = exchange.exchanged.currency;
    exchange.exchanged = this.exchange(exchange.original.value, from, to);
    return exchange;
  }

  enhanceExchangeInfo<T, K extends keyof T>(obj: T, originalCurrency: Currency, properties: K[]): Omit<T, K> & Record<K, ExchangeStructureType> {
    let result = { ...obj } as Omit<T, K> & Record<K, ExchangeStructureType>;

    const defaultCurrency = this.currencyDefault();

    properties.forEach(prop => {
      if (typeof obj[prop] === 'number') {
        (result as any)[prop] = {
          original: {
            value: obj[prop] as number,
            currency: originalCurrency
          },
          exchanged: this.exchange(obj[prop] as number, originalCurrency, defaultCurrency)
        }
      }
    })

    return result;
  }

  /**
   * Get exchange rates for a specific year.
   * @param year - The year to retrieve exchange rates for.
   * @returns Exchange rates for the specified year.
   */
  getExchangesByYear(year: number) {
    return this.sourceService.dataSource.exchanges()[year] || {};
  }

  /**
   * Get exchange rates between two currencies for a specific year.
   * @param year - The year to retrieve exchange rates for.
   * @param from - The source currency.
   * @param to - The target currency.
   * @returns Exchange rates between the specified currencies for the given year.
   */
  getExchangeRate(year: number, from: string, to: string): number[] | undefined {
    const yearExchanges = this.getExchangesByYear(year);
    return yearExchanges[from]?.[to];
  }

  /**
   * Get all available years with exchange data.
   * @returns An array of years with exchange data.
   */
  getAvailableYears(): number[] {
    return Object.keys(this.sourceService.dataSource.exchanges()).map(Number);
  }

  /**
   * Retrieves the exchange history for a specified year.
   *
   * @param year - The year for which to fetch the exchange history.
   * @returns An observable or promise containing the exchange history
   *          data for the specified year.
   */
  getExchangesInYear(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    return this.coinService.getExchangesHistory(startDate, endDate);
  }
}

