import { Pipe, PipeTransform } from '@angular/core';
import { TransactionEnum, TransactionEnumDesc } from '../model/investment.model';

@Pipe({
  name: 'transactionType',
  standalone: true
})
export class TransactionTypePipe implements PipeTransform {

  transform(type: TransactionEnum): string {
    return TransactionEnumDesc[type];
  }

}
