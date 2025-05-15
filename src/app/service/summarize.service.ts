import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SummarizeService {

  constructor() { }

  summarizeClass(items: {classify: string, value: number}[]) {
    const summary = items.reduce((acc, item) => {
      if (!acc[item.classify]) {
        acc[item.classify] = { classify: item.classify, value: 0 };
      }
      acc[item.classify].value += item.value;
      return acc;
    }, {} as Record<string, { classify: string; value: number }>);

    return Object.values(summary);
  }

  summarizeClassMonth(items: {classify: string, values: number[], month: number}[]) {
    const values = items.reduce((acc, item) => {
      if (!acc[item.classify]) {
        acc[item.classify] = { classify: item.classify, value: item.values[item.month] };
      }
      return acc;
    }, {} as Record<string, { classify: string; value: number }>);

    return this.summarizeClass(Object.values(values));
  }

}