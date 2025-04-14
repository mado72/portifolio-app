import { computed, Directive, effect, ElementRef, HostListener, inject, input } from '@angular/core';
import { Currency } from '../../model/domain.model';
import { SourceService } from '../../service/source.service';

@Directive({
  selector: '[appCurrencyChoice]',
  standalone: true
})
export class CurrencyChoiceDirective {

  private el = inject(ElementRef);

  private sourceService = inject(SourceService);

  appCurrencyChoice = input<Currency | keyof typeof Currency>(this.sourceService.currencyDefault());

  active = computed(() => this.appCurrencyChoice() === this.sourceService.currencyDefault());

  @HostListener("click", ['$event']) onClick($event: MouseEvent) {
    this.sourceService.currencyDefault.set(Currency[this.appCurrencyChoice()]);
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
