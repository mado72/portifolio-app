import { Pipe, PipeTransform } from '@angular/core';
import { TransactionDesc, TransactionEnum } from '../../model/domain.model';

@Pipe({
  name: 'cashflowType',
  standalone: true
})
export class CashflowTypePipe implements PipeTransform {

  transform(value: TransactionEnum): string {
    return TransactionDesc[value];
  }

}
