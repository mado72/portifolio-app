import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./layout/header/header.component";
import { RemoteQuotesService } from './service/remote-quotes.service';
import { ExchangeButtonComponent } from "./utils/component/exchange-button/exchange-button.component";
import { SourceService } from './service/source.service';
import { JsonPipe } from '@angular/common';
import { PortfolioService } from './service/portfolio-service';
import { BalanceService } from './service/balance.service';

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

  source = computed(() => {
    const acc : Record<string, any> = {};
    const datasource = this.sourceService.dataSource;
    acc["portfolios"] = datasource.portfolio();
    acc["assets"] = datasource.asset();
    acc["accounts"] = datasource.balance();
    acc["transactions"] = datasource.investment();
    return acc;
  })

  constructor() {
    inject(RemoteQuotesService);
  }
}
