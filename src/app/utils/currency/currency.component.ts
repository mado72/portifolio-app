import { Component, inject, Input } from '@angular/core';
import { Currency, CurrencyPrice as CurrencyPrice, toCurrencyCode } from '../../model/domain.model';
import { DecimalPipe } from '@angular/common';
import { SourceService } from '../../service/source.service';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './currency.component.html',
  styleUrl: './currency.component.scss'
})
export class CurrencyComponent {

  private sourceService = inject(SourceService);

  @Input() value?: CurrencyPrice = {
    price: 0,
    currency: this.sourceService.currencyDefault()
  }

  get currency(): Currency {
    return this.value?.currency || this.sourceService.currencyDefault();
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
      this.value = { price: value, currency: this.sourceService.currencyDefault() };
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
