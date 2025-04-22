import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, Input, signal } from '@angular/core';
import { Currency, CurrencyValue, toCurrencyCode } from '../../model/domain.model';
import { ExchangeService } from '../../service/exchange.service';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './currency.component.html',
  styleUrl: './currency.component.scss'
})
export class CurrencyComponent {

  private exchangeService = inject(ExchangeService);

  protected value$ = signal<CurrencyValue>({
    value: 0,
    currency: this.exchangeService.currencyDefault()
  });

  constructor() {
    effect(()=> {
      this.currency = this.exchangeService.currencyDefault();
    }, {allowSignalWrites: true})
  }

  @Input()
  set currency(currency: Currency) {
    this.value$.update((v)=>({
      ...v,
      currency
    }))
  }

  get currency() {
    return this.value$().currency;
  }

  @Input()
  set amount(amount: number) {
    this.value$.update((v)=> ({
      ...v,
      value: amount
    }))
  }

  get amount() {
    return this.value$().value;
  }

  @Input()
  set value(value: CurrencyValue) {
    this.value$.set(value);
  }

  @Input() displayZero: boolean = false;

  @Input() format: string = '1.2-2';

  get sigla() {
    return toCurrencyCode(this.currency)
  }

}
