import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ExchangeService } from '../../../service/exchange.service';

@Component({
  selector: 'app-exchange-button',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './exchange-button.component.html',
  styleUrl: './exchange-button.component.scss'
})
export class ExchangeButtonComponent {

  private exchangeService = inject(ExchangeService);

  exchangeView = computed(()=> this.exchangeService.exchangeView());
  
  toggleViewExchange() {
    this.exchangeService.toggleExchangeView();
  }

}
