import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./layout/header/header.component";
import { RemoteQuotesService } from './service/remote-quotes.service';
import { ExchangeButtonComponent } from "./utils/component/exchange-button/exchange-button.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    ExchangeButtonComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'portifolio-app';

  constructor() {
    inject(RemoteQuotesService);
  }
}
