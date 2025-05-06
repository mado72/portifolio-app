import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Currency } from '../../model/domain.model';
import { ExchangeService } from '../../service/exchange.service';
import { CurrencyChoiceDirective } from '../../utils/directive/currency-choice.directive';
import { DownloadDataDirective } from '../../utils/directive/download-data.directive';
import { EmptyDataDirective } from '../../utils/directive/empty-data.directive';
import { UploadDataDirective } from '../../utils/directive/upload-data.directive';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink,
    DownloadDataDirective,
    UploadDataDirective,
    EmptyDataDirective,
    CurrencyChoiceDirective,
    DecimalPipe
],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
/**
 * The `MenuComponent` class is responsible for managing the behavior and state of a menu in the application.
 * It provides functionality for toggling the menu, handling submenus, and displaying exchange rate information.
 */
export class MenuComponent {

  private exchangeService = inject(ExchangeService);

  currencies = Object.values(Currency);

  exchanges = computed(()=> {
    const exchanges = this.exchangeService.exchanges();
    if (!exchanges || Object.keys(exchanges).length === 0) return [];

    const currencyDefault = this.exchangeService.currencyDefault();

    return Object.keys(exchanges[currencyDefault]).map(to=>({
      symbol: this.exchangeService.currencyToSymbol(to),
      currency: Currency[to as keyof typeof Currency],
      factor: exchanges[currencyDefault][to as keyof typeof Currency]
    }))
  })

  submenu : Record<string, boolean> = {};

  menuClosed = true;

  toggleMenu() {
    this.menuClosed =!this.menuClosed;
  }

  openSubmenu(id: string) {
    const toggle = !this.submenu[id];
    this.submenu = {};
    this.submenu[id] = toggle;
  }

  closeMenus(): void {
    this.submenu = {}
  }

  hideSubmenu(id: string) {
    delete this.submenu[id];
  }
}
