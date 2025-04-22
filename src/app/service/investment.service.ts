import { computed, inject, Injectable } from '@angular/core';
import { getYear, setYear } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { Income, IncomeEnum } from '../model/investment.model';
import { IncomeType } from '../model/source.model';
import { getMarketPlaceCode } from './quote.service';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  private sourceService = inject(SourceService);

  private earningsData = computed(() => Object.entries(this.sourceService.incomeSource()).reduce((acc, [key, item]) => {
    return {...acc, [key]: {...item } };
  }, {} as Record<number, Income>))

  findIncomesBetween(from: Date, to: Date): Income[] {
    // FIXME: Está mockado
    return Object.values(this.earningsData())
      .map(item => ({ ...item, date: setYear(item.date, getYear(from)) }));
  }

  findIncomesOfAsset({ marketPlace, code }: { marketPlace: string, code: string }) {
    const ticker = getMarketPlaceCode({ marketPlace, code });
    return Object.values(this.earningsData())
      .filter(item => item.ticker === ticker);
  }

  addIncome(ticker: string, data: { date: Date; type: IncomeEnum, amount: number; }) {
    const reg = {
      ...data,
      ticker,
      id: uuid()
    } as IncomeType;
    this.sourceService.addIncome(reg);

    return reg;    
  }

  updateIncome(id: string, data: { date: Date; type: IncomeEnum, amount: number; }) {
    const income = this.sourceService.incomeSource()[id];
    const ticker = income.ticker;
    this.sourceService.updateIncome([{
      ...data,
      id,
      ticker
    }]);
  }

  deleteIncome(id: string) {
    this.sourceService.deleteIncome(id);
  }

}
