import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, LOCALE_ID, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { faExchange } from '@fortawesome/free-solid-svg-icons';
import { CurrencyValue } from '../../../model/domain.model';
import { toObservable } from '@angular/core/rxjs-interop';

export type ExchangeInputType = {
  original: CurrencyValue,
  exchanged: CurrencyValue
}

@Component({
  selector: 'app-exchange',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    DecimalPipe
  ],
  templateUrl: './exchange.component.html',
  styleUrl: './exchange.component.scss'
})
export class ExchangeComponent {

  readonly faExchange = faExchange;

  private decimalPipe = new DecimalPipe(inject(LOCALE_ID));

  exchange = input<ExchangeInputType| null>(null);

  display = input<"original" | "exchanged" | null>(null);

  exchangeDisplay = signal<"original" | "exchanged">("exchanged");

  hideIcon = input<boolean>(false);

  value = computed(()=> {
    const exchange = this.exchange();
    if (!exchange) {
      return null;
    }
    const display = this.exchangeDisplay() as keyof ExchangeInputType;
    return exchange[display];
  });

  other = computed(()=> {
    const exchange = this.exchange();
    if (!exchange) {
      return null;
    }
    const display = this.exchangeDisplay() === "original" ? "exchanged" : "original";
    return exchange[display];
  });

  displayChanged = toObservable(this.display).subscribe(value=>{
    if (value)
      this.exchangeDisplay.set(value);
  })

  toggle() {
    this.exchangeDisplay.update(exchange => exchange === "original" ? "exchanged" : "original");
  }

  iconTitle = computed(() => this.other()?.currency + ' ' + this.decimalPipe.transform(this.other()?.value, "1.2-2"))

}
