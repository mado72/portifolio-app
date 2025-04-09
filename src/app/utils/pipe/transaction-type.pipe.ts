import { Pipe, PipeTransform } from '@angular/core';
import { InvestmentEnum, InvestmentEnumDesc } from '../../model/investment.model';


@Pipe({
  name: 'transactionType',
  standalone: true
})
export class TransactionTypePipe implements PipeTransform {

  transform(value: InvestmentEnum): string {
    return InvestmentEnumDesc[value];
  }

}
