import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { environment } from '../environments/environment';
import { HeaderComponent } from "./layout/header/header.component";
import { ExchangeService } from './service/exchange.service';
import { RemoteQuotesService } from './service/remote-quotes.service';
import { SourceService } from './service/source.service';
import { ExchangeButtonComponent } from "./utils/component/exchange-button/exchange-button.component";
import { HealthStatusComponent } from './components/health-status/health-status.component';

const DEBOUNCE_TIME = 1000;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    ExchangeButtonComponent,
    HealthStatusComponent,
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'portfolio-app';

  private sourceService = inject(SourceService);
  // private portfolioService = inject(PortfolioService);
  // private balanceService = inject(BalanceService);
  private remoteQuoteService = inject(RemoteQuotesService);
  private exchangeService = inject(ExchangeService);

  source = signal<any>({});

  exchanges = computed(() => this.exchangeService.exchanges());  

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
    console.log('AppComponent constructor');
    console.log('AppComponent environment: ', environment.name);
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
    console.log('Initializing AppComponent...');
    setTimeout(() => {
      console.log('AppComponent updating exchanges...');
      this.remoteQuoteService.updateExchanges().subscribe(() => {
        console.log('AppComponent exchanges updated');
        this.sourceService.loadInitialData();
        
      });
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.remoteQuoteService.destroy();
  }
}
