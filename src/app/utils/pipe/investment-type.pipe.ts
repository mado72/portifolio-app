import { Pipe, PipeTransform } from '@angular/core';
import { InvestmentEnum, InvestmentEnumDesc } from '../../model/investment.model';

@Pipe({
  name: 'investmentType',
  standalone: true
})
export class InvestmentTypePipe implements PipeTransform {

  transform(value: InvestmentEnum): string {
    return InvestmentEnumDesc[value];
  }

}
