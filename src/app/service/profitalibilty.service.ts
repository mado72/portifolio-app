import { computed, inject, Injectable } from '@angular/core';
import { groupBy } from '../model/functions.model';
import { ExchangeService } from './exchange.service';
import { PortfolioService } from './portfolio-service';
import { getMonth, getYear } from 'date-fns';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class ProfitabilityService {

  private sourceService = inject(SourceService);

  private portfolioService = inject(PortfolioService);

  private exchangeService = inject(ExchangeService);

  current = computed<Record<string,number>>(() => {
    const portfolios = this.portfolioService.portfolios();

    const currencyDefault = this.exchangeService.currencyDefault();

    const portfoliosMap = groupBy(Object.values(portfolios), (portfolio) => portfolio.classify);

    const classes = Array.from(portfoliosMap.keys()).reduce((acc, className) => {
      const ports = portfoliosMap.get(className);
      if (!!ports?.length) {
        acc[className] = ports.reduce((accPorts, portfolio) => {
          accPorts += this.exchangeService.exchange(portfolio.total.marketValue, portfolio.currency, currencyDefault).value
          return Math.round(accPorts * 100) / 100;
        }, 0)
      }
      return acc;
    }, {} as Record<string,number>);

    // console.log(classes);
    return classes;
  })

  historical = computed<Record<string, number[]>>(()=>{
    if (!this.sourceService.dataIsLoaded()) {
      return {};
    }
    const currentYear = getYear(new Date());
    return this.sourceService.dataSource.profitability()[currentYear];
  })

  constructor() { }
}
