import { computed, inject, Injectable } from '@angular/core';
import { groupBy } from '../model/functions.model';
import { ExchangeService } from './exchange.service';
import { PortfolioService } from './portfolio-service';

@Injectable({
  providedIn: 'root'
})
export class ProfitabilityService {

  private portfolioService = inject(PortfolioService);

  private exchangeService = inject(ExchangeService);

  historical = computed<Record<number, Record<string,number>>>(()=>{
    return {};
  })

  current = computed<Record<string,number>>(() => {
    const portfolios = this.portfolioService.portfolios();

    const currencyDefault = this.exchangeService.currencyDefault();

    const portfoliosMap = groupBy(Object.values(portfolios), (portfolio) => portfolio.classify);

    const classes = Array.from(portfoliosMap.keys()).reduce((acc, className) => {
      const ports = portfoliosMap.get(className);
      if (!!ports?.length) {
        acc[className] = ports.reduce((accPorts, portfolio) => {
          accPorts += this.exchangeService.exchange(portfolio.total.marketValue, portfolio.currency, currencyDefault).value
          return accPorts;
        }, 0)
      }
      return acc;
    }, {} as Record<string,number>);

    console.log(classes);
    return classes;
  })

  constructor() { }
}
