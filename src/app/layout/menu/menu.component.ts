import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DownloadDataDirective } from '../../utils/directive/download-data.directive';
import { UploadDataDirective } from '../../utils/directive/upload-data.directive';
import { EmptyDataDirective } from '../../utils/directive/empty-data.directive';
import { QuoteService } from '../../service/quote.service';
import { Currency } from '../../model/domain.model';
import { CurrencyChoiceDirective } from '../../utils/directive/currency-choice.directive';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink,
    DownloadDataDirective,
    UploadDataDirective,
    EmptyDataDirective,
    CurrencyChoiceDirective
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  currencies = Object.values(Currency);

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
