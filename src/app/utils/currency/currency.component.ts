import { Component, Input } from '@angular/core';
import { Currency, toCurrencyCode } from '../../model/domain.model';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './currency.component.html',
  styleUrl: './currency.component.scss'
})
export class CurrencyComponent {

  @Input() currency: Currency = Currency.BRL;

  @Input() value: number = 0;

  @Input() color: string | undefined = undefined;

  @Input() displayZero: boolean = false;

  @Input() format: string = '1.2-2';

  get sigla() {
    return toCurrencyCode(this.currency)
  }

  get elementStyle() {
    return this.color ? this.color : this.value < 0 ? 'red' : 'rgb(0,80,0)';
  }
}
