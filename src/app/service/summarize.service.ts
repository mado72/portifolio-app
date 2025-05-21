import { inject, Injectable } from '@angular/core';
import { ExchangeService } from './exchange.service';
import { Currency } from '../model/domain.model';

@Injectable({
  providedIn: 'root'
})
export class SummarizeService {

  private exchangeService = inject(ExchangeService);

  constructor() { }

  summarizeClass(items: {classify: string, value: number}[]) {
    const summary = items.reduce((acc, item) => {
      if (!acc[item.classify]) {
        if (! item.classify) {
          return acc;
        }
        acc[item.classify] = { classify: item.classify, value: 0 };
      }
      acc[item.classify].value += item.value;
      return acc;
    }, {} as Record<string, { classify: string; value: number }>);

    return Object.values(summary);
  }

  summarizeClassMonth(items: {classify: string, currency: Currency, values: number[]}[], month: number) {
    const currency = this.exchangeService.currencyDefault();

    const values = items.reduce((acc, item) => {
      if (!acc[item.classify]) {
        acc[item.classify] = { classify: item.classify, value: 
          this.exchangeService.exchange(item.values[month], item.currency, currency).value };
      }
      else {
        acc[item.classify].value += 
          this.exchangeService.exchange(item.values[month], item.currency, currency).value;
      }
      return acc;
    }, {} as Record<string, { classify: string; value: number }>);

    return this.summarizeClass(Object.values(values));
  }

  summarizeClassYear(items: {classify: string, currency: Currency, values: number[]}[]) {
    const currency = this.exchangeService.currencyDefault();

    const values = items.reduce((acc, item) => {
      if (!acc[item.classify]) {
        acc[item.classify] = { classify: item.classify, value: 0 };
      }
      for (let i = 0; i < item.values.length; i++) {
        acc[item.classify].value += 
          this.exchangeService.exchange(item.values[i], item.currency, currency).value;
      }
      return acc;
    }, {} as Record<string, { classify: string; value: number }>);

    return this.summarizeClass(Object.values(values));
  }

  summarizeMatrix(items: { classify: string; values: number[] }[]) : number[]{
    const currency = this.exchangeService.currencyDefault();
    const values = items.reduce((acc, item) => {
      for (let i = 0; i < item.values.length; i++) {
        if (!acc[i]) {
          acc[i] = 0;
        }
        acc[i] += item.values[i];
      }
      return acc;
    }, [] as number[]);

    return values;
  }

  computeGrowthRate(lastValue: number, values: number[]): number[] {
    return values.map((value, index) => {
      if (index === 0 && lastValue === 0) {
        lastValue = value; // Update lastValue for the next iteration
        return 0; // No growth rate for the first item
      }
      const growthRate = ((value - lastValue) / lastValue) * 100;
      lastValue = value; // Update lastValue for the next iteration
      return Math.round(growthRate);
    });
  }

  computeVariation({lastValue, values, incomes, withdrawals, contributions}: 
      {lastValue: number, values: number[], incomes: number[], withdrawals: number[], contributions: number[]}): number[] {
    return values.map((value, index) => {
      if (index === 0 && lastValue === 0) {
        lastValue = value; // Update lastValue for the next iteration
        return 0; // No growth rate for the first item
      }

      const income = incomes[index] || 0;
      const contribution = contributions[index] || 0;
      const withdrawal = withdrawals[index] || 0;

      const variation = value - (lastValue + contribution - income - withdrawal);
      lastValue = value; // Update lastValue for the next iteration
      return variation;
    });
  }

  computeVariationRate(lastValue: number, variations: number[], incomes: number[]): number[] {

    return variations.map((value, index) => {
      if (index === 0 && lastValue === 0) {
        lastValue = value; // Update lastValue for the next iteration
        return 0; // No growth rate for the first item
      }
      const income = incomes[index] || 0;
      const growthRate = (value / (lastValue + income)) * 10000;
      lastValue = value; // Update lastValue for the next iteration
      return Math.round(growthRate) / 100;
    });
  }

  computeVariationAccumulated(variationsRate: number[]): number[] {
    return variationsRate.map((value, index) => {
      if (index === 0 ) {
        const accumulated = variationsRate[index];
        return accumulated; // No growth rate for the first item
      }
      const accumulated = (1 + variationsRate[index]) * (1 + variationsRate[index - 1]) - 1;
      return Math.round(accumulated * 10000) / 10000;
    });
  }

  yieldRate(values: number[], incomes: number[]): number[] {
    return values.map((value, index) => {
      const income = incomes[index] || 0;
      if (value === 0 && income === 0) {
        return 0; // No yield rate for 0 value and income
      }
      const yieldRate = (value / income) * 100;
      return Math.round(yieldRate);
    });
  }

}