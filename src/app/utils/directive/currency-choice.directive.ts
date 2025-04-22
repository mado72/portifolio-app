import { computed, Directive, effect, ElementRef, HostListener, inject, input } from '@angular/core';
import { Currency } from '../../model/domain.model';
import { ExchangeService } from '../../service/exchange.service';

@Directive({
  selector: '[appCurrencyChoice]',
  standalone: true
})
export class CurrencyChoiceDirective {

  private el = inject(ElementRef);

  private exchangeService = inject(ExchangeService);

  appCurrencyChoice = input<Currency | keyof typeof Currency>(this.exchangeService.currencyDefault());

  active = computed(() => this.appCurrencyChoice() === this.exchangeService.currencyDefault());

  @HostListener("click", ['$event']) onClick($event: MouseEvent) {
    this.exchangeService.currencyDefault.set(Currency[this.appCurrencyChoice()]);
  }

  constructor() {
    effect(() => {
      if (this.active()) {
        this.el.nativeElement.classList.add('active-currency');
      }
      else {
        this.el.nativeElement.classList.remove('active-currency');
      }
    })
  }

}
