import { computed, inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { ExchangeStructureType, ExchangeView } from '../model/investment.model';
import { RemoteQuotesService } from './remote-quotes.service';
import { CurrencyPipe } from '@angular/common';
import { Currency, CurrencyType } from '../model/domain.model';
import { SourceService } from './source.service';

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

  readonly exchangeView = signal<ExchangeView>("original");

  private currencyPipe = new CurrencyPipe(inject(LOCALE_ID));

  readonly currencyDefault = signal<Currency>(Currency.BRL);

  readonly exchanges = computed(() => this.remoteQuotesService.exchanges());

  constructor(private remoteQuotesService: RemoteQuotesService) { }

  toggleExchangeView() {
    this.exchangeView.update(exchangeView => (exchangeView === "original" ? "exchanged" : "original"));
  }

  getExchangeQuote(from: Currency, to: Currency) {
    const exchanges = this.exchanges();
    return exchanges[from]?.[to];
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
}

