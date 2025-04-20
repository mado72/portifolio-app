import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./layout/header/header.component";
import { RemoteQuotesService } from './service/remote-quotes.service';
import { ExchangeButtonComponent } from "./utils/component/exchange-button/exchange-button.component";
import { SourceService } from './service/source.service';
import { JsonPipe } from '@angular/common';
import { PortfolioService } from './service/portfolio-service';

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

  sourceService = inject(SourceService);
  portfolioService = inject(PortfolioService);

  portfolios = this.portfolioService.portfolios;

  transactions = this.sourceService.investmentSource;

  assets = this.sourceService.assetSource;

  constructor() {
    inject(RemoteQuotesService);
  }
}
