import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { faExchange } from '@fortawesome/free-solid-svg-icons';
import { ExchangeService } from '../../service/exchange.service';
import { PortfolioService } from '../../service/portfolio-service';
import { ExchangeComponent } from "../../utils/component/exchange/exchange.component";

@Component({
  selector: 'app-summarize-portfolio-class',
  standalone: true,
  imports: [
    MatTableModule,
    DecimalPipe,
    PercentPipe,
    ExchangeComponent
],
  templateUrl: './summarize-portfolio-class.component.html',
  styleUrl: './summarize-portfolio-class.component.scss'
})
export class SummarizePortfolioClassComponent {

  private exchangeService = inject(ExchangeService);

  private portfolioService = inject(PortfolioService);

  readonly faExchange = faExchange;

  currency = computed(()=>this.exchangeService.currencyDefault());

  summarySignal = computed(()=>
    this.portfolioService.summarizeByClass(
      Object.values(this.portfolioService.portfolios())))

  datasource = computed(()=>this.summarySignal().items || []);

  total = computed(()=>({
    ...this.exchangeService.enhanceExchangeInfo(this.summarySignal().total, this.currency(), ["value"]).value
  }));

  totalPercPlanned = computed(()=>this.datasource().reduce((acc,vl)=>acc+=vl.percPlanned,0));

  totalPercActual = computed(()=>this.datasource().reduce((acc,vl)=>{
    return acc+=vl.percAlloc;
  },0));

  displayedColumns: string[] = ['class', 'financial', 'percPlanned', 'percActual'];

  ngOnInit(): void {}

}
