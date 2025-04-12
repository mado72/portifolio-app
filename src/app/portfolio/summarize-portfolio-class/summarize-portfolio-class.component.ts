import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { faExchange } from '@fortawesome/free-solid-svg-icons';
import { Currency } from '../../model/domain.model';
import { PortfolioService } from '../../service/portfolio-service';
import { SourceService } from '../../service/source.service';
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

  private sourceService = inject(SourceService);

  private portfolioService = inject(PortfolioService);

  readonly faExchange = faExchange;

  currency = input<Currency>(this.sourceService.currencyDefault());

  summarySignal = computed(()=>
    this.portfolioService.summarizeByClass(
      Object.values(this.portfolioService.portfolios())))

  datasource = computed(()=>this.summarySignal().items || []);

  total = computed(()=>this.summarySignal().total);

  totalPercPlanned = computed(()=>this.datasource().reduce((acc,vl)=>acc+=vl.percPlanned,0));

  totalPercActual = computed(()=>this.datasource().reduce((acc,vl)=>{
    return acc+=vl.percAlloc;
  },0));

  displayedColumns: string[] = ['class', 'financial', 'percPlanned', 'percActual'];

  ngOnInit(): void {}

}
