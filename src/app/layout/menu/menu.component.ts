import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Currency } from '../../model/domain.model';
import { QuoteService } from '../../service/quote.service';
import { SourceService } from '../../service/source.service';
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
export class MenuComponent {

  private sourceService = inject(SourceService);

  private quoteService = inject(QuoteService);

  currencies = Object.values(Currency);

  exchanges = computed(()=> {
    const exchanges = this.quoteService.exchanges();
    if (!exchanges || Object.keys(exchanges).length === 0) return [];

    const currencyDefault = this.sourceService.currencyDefault();

    return Object.keys(exchanges[currencyDefault]).map(from=>({
      symbol: this.quoteService.currencyToSymbol(from),
      currency: Currency[from as keyof typeof Currency],
      factor: exchanges[from as keyof typeof Currency][currencyDefault]
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
