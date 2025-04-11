import { Pipe, PipeTransform } from '@angular/core';
import { InvestmentEnum, InvestmentEnumDesc } from '../../model/investment.model';

@Pipe({
  name: 'investmentType',
  standalone: true
})
export class InvestmentTypePipe implements PipeTransform {

  transform(value: InvestmentEnum | string): string {
    const k = typeof value === 'string' ? InvestmentEnum[value as keyof typeof InvestmentEnum] : value;
    return InvestmentEnumDesc[k];
  }

}
