import { computed, inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { ExchangeStructureType, ExchangeView } from '../model/investment.model';
import { RemoteQuotesService } from './remote-quotes.service';
import { SourceService } from './source.service';
import { CurrencyPipe } from '@angular/common';
import { Currency, CurrencyType } from '../model/domain.model';

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

  private remoteQuotesService = inject(RemoteQuotesService);

  readonly exchangeView = signal<ExchangeView>("original");

  private currencyPipe = new CurrencyPipe(inject(LOCALE_ID));

  readonly currencyDefault = signal<Currency>(Currency.BRL);

  readonly exchanges = computed(() => this.remoteQuotesService.exchanges());

  constructor() { }

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


}
