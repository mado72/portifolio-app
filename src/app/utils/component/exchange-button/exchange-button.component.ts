import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QuoteService } from '../../../service/quote.service';

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

  private quoteService = inject(QuoteService);

  exchangeView = computed(()=> this.quoteService.exchangeView());
  
  toggleViewExchange() {
    this.quoteService.toggleExchangeView();
  }

}
