import { Component, Input } from '@angular/core';
import { Currency, CurrencyPrice as CurrencyPrice, toCurrencyCode } from '../../model/domain.model';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './currency.component.html',
  styleUrl: './currency.component.scss'
})
export class CurrencyComponent {

  @Input() value?: CurrencyPrice = {
    price: 0,
    currency: Currency.BRL
  }

  get currency(): Currency {
    return this.value?.currency || Currency.BRL;
  }
  @Input()
  set currency(value: Currency) {
    if (!this.value) {
      this.value = { price: 0, currency: value };
    }
    this.value.currency = value;
  }

  get amount(): number {
    return this.value?.price || 0; 
  }
  @Input()
  set amount(value: number) {
    if (!this.value) {
      this.value = { price: value, currency: Currency.BRL };
    }
    this.value.price = value;
  }

  @Input() color: string | undefined = undefined;

  @Input() displayZero: boolean = false;

  @Input() format: string = '1.2-2';

  get sigla() {
    return toCurrencyCode(this.currency)
  }

  get elementStyle() {
    return this.color ? this.color : this.amount < 0 ? 'red' : 'rgb(0,80,0)';
  }
}
