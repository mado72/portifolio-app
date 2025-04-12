import { DecimalPipe } from '@angular/common';
import { Component, inject, Input, signal } from '@angular/core';
import { Currency, CurrencyValue, toCurrencyCode } from '../../model/domain.model';
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

  protected value$ = signal<CurrencyValue>({
    value: 0,
    currency: this.sourceService.currencyDefault()
  });

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
