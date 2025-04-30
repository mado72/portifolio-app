import { Component, computed, inject, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
  title = 'portifolio-app';

  private sourceService = inject(SourceService);
  private portfolioService = inject(PortfolioService);
  private balanceService = inject(BalanceService);
  private remoteQuoteService = inject(RemoteQuotesService);

  source = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.sourceService.getData();
  });

  portfolios = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.portfolioService.portfolios();
  });

  transactions = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.sourceService.investmentSource();
  });

  assets = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.sourceService.assetSource();
  });

  balances = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.balanceService.getAccounts();
  });


  constructor() {
    setDefaultOptions({ locale: ptBR })
  }

  ngOnInit() {
    this.remoteQuoteService.updateExchanges().subscribe(() => {
      this.sourceService.loadInitialData();
    });
  }
}
