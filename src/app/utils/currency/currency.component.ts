import { Component, Input } from '@angular/core';
import { Moeda, moedaSiglaConverter } from '../../model/domain.model';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './currency.component.html',
  styleUrl: './currency.component.scss'
})
export class CurrencyComponent {

  @Input() moeda: Moeda = Moeda.BRL;

  @Input() valor: number = 0;

  @Input() color: string | undefined = undefined;

  get sigla() {
    return moedaSiglaConverter(this.moeda)
  }

  get elementStyle() {
    return this.color ? this.color : this.valor < 0 ? 'red' : 'rgb(0,80,0)';
  }
}
