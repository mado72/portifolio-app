import { inject, Injectable } from '@angular/core';
import { PortfolioService } from './portfolio-service';
import { TransactionService } from './transaction.service';
import { Currency } from '../model/domain.model';
import { PortfolioType } from '../model/source.model';
import { InvestmentEnum, TransactionStatus } from '../model/investment.model';
import { concat } from 'rxjs';


export type ImportType = {
  portfolio: string;
  asset: string;
  quantity: number;
  value: number;
  currency: string;
  date: string;
}

export type ParseResult = {
  parsed: ImportType[] | null;
  error: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MassiveService {

  private portolioService = inject(PortfolioService);

  private transactionService = inject(TransactionService);

  constructor() { }

  parseJson(data: any) : ParseResult{
    const result: ParseResult = {
      parsed: null,
      error: []
    };

    const json = JSON.parse(data);

    if (!Array.isArray(json)) {
      result.error.push('O JSON não é um array');
      return result;
    }

    result.parsed = json.map((item: any, index) => {

      if (!this.isNumber(item.quantity)) {
        result.error.push(`Item no índice ${index} tem um valor de quantidade inválido`);
        return null;
      }
      if (!this.isNumber(item.value)) {
        result.error.push(`Item no índice ${index} tem um valor de valor inválido`);
        return null;
      }
      if (isNaN(Date.parse(item.date))) {
        result.error.push(`Item no índice ${index} tem uma data inválida`);
        return null;
      }
      const [marketPlace, code] = item.asset.split(':');
      if (!marketPlace || !code) {
        result.error.push(`Item no índice ${index} tem um ativo inválido`);
        return null;
      }
      item.quantity = Number(item.quantity.replace(/,/, '.'));
      item.value = Number(item.value.replace(/,/, '.'));
      item.date = new Date(item.date).toISOString().split('T')[0];
      item.portfolio = item.portfolio.trim();
      item.asset = item.asset.trim();
      item.currency = item.currency.trim().toUpperCase();
      
      if (!this.isImportType(item)) {
        result.error.push(`Item no índice ${index} não é um objeto ImportType válido`);
        return null;
      }

      return {
        portfolio: item.portfolio.trim(),
        asset: item.asset.trim(),
        quantity: Number(item.quantity),
        value: Number(item.value),
        currency: item.currency.trim().toUpperCase(),
        date: item.date
      } as ImportType

      return item as ImportType;
    }).filter((item: any) => item !== null) as ImportType[];

    if (result.error.length > 0) {
      return result;
    }

    return result;
  }

  private isImportType(item: any): item is ImportType {
    return (
      typeof item.portfolio === 'string' &&
      typeof item.asset === 'string' &&
      typeof item.quantity === 'number' &&
      typeof item.value === 'number' &&
      typeof item.currency === 'string' &&
      typeof item.date === 'string'
    );
  }

  private isNumber(value: any): value is number {
    return !isNaN(Number(value.replace(/,/, '.')));
  }

  parseCsv(data: string): ParseResult {
    const result: ParseResult = {
      parsed: null,
      error: []
    };

    result.parsed = data.split('\n').reduce((acc, line: string) => {
      const [portfolio, asset, quantity, currency, value, date] = line.split('\t');
      if (portfolio && asset && quantity && value && currency && date) {
        const item = {
          portfolio: portfolio.trim(),
          asset: asset.trim(),
          quantity: Number(quantity.replace(/,/, '.')),
          value: Number(value.replace(/,/, '.')),
          currency: currency.trim().toUpperCase(),
          date: new Date(date).toISOString().split('T')[0]
        };
        if (!this.isImportType(item) || isNaN(item.value) || isNaN(item.quantity)) {
          result.error.push(`Linha "${line}" não é um objeto ImportType válido`);
          return acc;
        }
        acc.push(item);
      }
      return acc;
    }, [] as ImportType[]);    

    return result;
  }

  import(accountId: string, parsed: ImportType[]) {

    type ImportPortfolioData = Record<string, {
      assets: [{
        asset: string;
        quantity: number;
        value: number;
        date: Date;
      }]
      currency: Currency;
      portfolio: string;
    }>;

    const portfoliosMap : ImportPortfolioData = (parsed || []).reduce((acc: ImportPortfolioData, item: ImportType) => {
      const portfolio = acc[item.portfolio] || {
        portfolio: item.portfolio,
        currency: item.currency,
        assets: [],
        total: {
          quantity: 0,
          value: 0,
          currency: item.currency
        }
      };
      portfolio.assets.push({
        asset: item.asset,
        quantity: item.quantity,
        value: item.value,
        date: new Date(item.date),
      });
      acc[item.portfolio] = portfolio;
      return acc;
    }, {} as ImportPortfolioData);

    const porfolios = Object.values(this.portolioService.portfolios()).reduce((acc, portfolio) => {
      acc[portfolio.name] = portfolio;
      return acc;
    }, {} as Record<string, PortfolioType>);

    const observables = Object.values(portfoliosMap).flatMap((item) => {
      let portfolio = Object.values(porfolios).find((port) => port.name === item.portfolio);
      if (!portfolio) {
        const raw = this.portolioService.addPortfolio({ name: item.portfolio, percPlanned: 0, currency: item.currency, classify: '' });
        portfolio = this.portolioService.portfolios()[raw.id];
      }
      if (!portfolio) {
        throw new Error('Portfolio not found or created');
      }

      return Object.values(item.assets).map((asset) => {
        return this.transactionService.saveTransaction({
          ticker: asset.asset,
          value: {
            currency: item.currency,
            value: asset.value / asset.quantity
          },
          quantity: asset.quantity,
          date: asset.date,
          status: TransactionStatus.PENDING,
          type: InvestmentEnum.BUY,
          accountId,
          id: '',
          quote: asset.value / asset.quantity,

        }, {
          [portfolio.id]: asset.quantity
        });
      });
    });

    return concat(...observables);    
  }
  
}
