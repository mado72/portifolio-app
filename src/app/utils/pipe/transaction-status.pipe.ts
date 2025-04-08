import { Pipe, PipeTransform } from '@angular/core';
import { TransactionStatus, TransactionStatusDesc } from '../../model/investment.model';

@Pipe({
  name: 'transactionStatus',
  standalone: true
})
export class TransactionStatusPipe implements PipeTransform {

  transform(status: TransactionStatus): string {
    return TransactionStatusDesc[status];
  }

}
