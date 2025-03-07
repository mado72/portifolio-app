import { Component, Input } from '@angular/core';
import { Currency, CurrencyAmount as CurrencyAmount, toCurrencyCode } from '../../model/domain.model';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './currency.component.html',
  styleUrl: './currency.component.scss'
})
export class CurrencyComponent {

  @Input() value?: CurrencyAmount = {
    amount: 0,
    currency: Currency.BRL
  }

  get currency(): Currency {
    return this.value?.currency || Currency.BRL;
  }
  @Input()
  set currency(value: Currency) {
    if (!this.value) {
      this.value = { amount: 0, currency: value };
    }
    this.value.currency = value;
  }

  get amount(): number {
    return this.value?.amount || 0; 
  }
  @Input()
  set amount(value: number) {
    if (!this.value) {
      this.value = { amount: value, currency: Currency.BRL };
    }
    this.value.amount = value;
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
