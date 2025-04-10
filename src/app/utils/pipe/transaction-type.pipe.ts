import { Pipe, PipeTransform } from '@angular/core';
import { TransactionDesc, TransactionEnum } from '../../model/domain.model';


@Pipe({
  name: 'transactionType',
  standalone: true
})
export class TransactionTypePipe implements PipeTransform {

  transform(value: TransactionEnum): string {
    return TransactionDesc[value];
  }

}
