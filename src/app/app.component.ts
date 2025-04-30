import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./layout/header/header.component";
import { RemoteQuotesService } from './service/remote-quotes.service';
import { ExchangeButtonComponent } from "./utils/component/exchange-button/exchange-button.component";
import { SourceService } from './service/source.service';
import { JsonPipe } from '@angular/common';
import { PortfolioService } from './service/portfolio-service';
import { BalanceService } from './service/balance.service';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    ExchangeButtonComponent,
    JsonPipe
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'portifolio-app';

  private sourceService = inject(SourceService);
  private portfolioService = inject(PortfolioService);
  private balanceService = inject(BalanceService);

  portfolios = this.portfolioService.portfolios;

  transactions = this.sourceService.investmentSource;

  assets = this.sourceService.assetSource;

  balances = this.balanceService.getAccounts

  source = this.sourceService.getData;

  constructor() {
    inject(RemoteQuotesService);
    setDefaultOptions({ locale: ptBR })
  }
}
