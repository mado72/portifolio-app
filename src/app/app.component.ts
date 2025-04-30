import { AfterViewInit, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
import { QuoteService } from './service/quote.service';
import { AssetQuoteType } from './model/source.model';

const DEBOUNCE_TIME = 1000;

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
export class AppComponent implements OnInit, OnDestroy {
  title = 'portifolio-app';

  private sourceService = inject(SourceService);
  private portfolioService = inject(PortfolioService);
  private balanceService = inject(BalanceService);
  private remoteQuoteService = inject(RemoteQuotesService);

  source = signal<any>({});

  // portfolios = computed(() => {
  //   if (!this.sourceService.dataIsLoaded()) {
  //     return {}
  //   }
  //   return this.portfolioService.portfolios();
  // });

  transactions = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.sourceService.investmentSource();
  });

  inputSource = computed(() => {
    if (!this.sourceService.dataIsLoaded()) {
      return {}
    }
    return this.sourceService.getData();
  });

  debounceTimeout: any = null;

  constructor() {
    setDefaultOptions({ locale: ptBR })

    effect(() => {
      const source = this.inputSource();

      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      this.debounceTimeout = setTimeout(() => {
        // this.assets.set(this.inputAssets());
        this.source.set(source);
      }, DEBOUNCE_TIME);
    });
  }

  ngOnInit(): void {
    this.remoteQuoteService.updateExchanges().subscribe(() => {
      this.sourceService.loadInitialData();
    });
  }

  ngOnDestroy(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.remoteQuoteService.destroy();
  }
}
