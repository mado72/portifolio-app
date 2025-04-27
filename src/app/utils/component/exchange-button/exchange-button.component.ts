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
/**
 * The `ExchangeButtonComponent` is responsible for managing the exchange view state
 * in the application. It interacts with the `ExchangeService` to toggle and retrieve
 * the current state of the exchange view.
 *
 * @remarks
 * This component uses Angular's dependency injection to access the `ExchangeService`
 * and leverages a computed property to reactively track the exchange view state.
 *
 * @property exchangeView - A computed property that provides the current state of the exchange view.
 *
 * @method toggleViewExchange - Toggles the state of the exchange view by invoking the corresponding
 * method in the `ExchangeService`.
 */
export class ExchangeButtonComponent {

  private exchangeService = inject(ExchangeService);

  exchangeView = computed(()=> {
    debugger;
    return this.exchangeService.exchangeView()
  });
  
  toggleViewExchange() {
    this.exchangeService.toggleExchangeView();
  }

}
