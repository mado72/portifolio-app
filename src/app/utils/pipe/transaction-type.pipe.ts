import { Pipe, PipeTransform } from '@angular/core';
import { TransactionEnum, TransactionEnumDesc } from '../../model/investment.model';


@Pipe({
  name: 'transactionType',
  standalone: true
})
export class TransactionTypePipe implements PipeTransform {

  transform(value: TransactionEnum): string {
    return TransactionEnumDesc[value];
  }

}
