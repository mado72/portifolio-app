import { Pipe, PipeTransform } from '@angular/core';
import { AccountTypeEnum } from '../../model/domain.model';

const AccountTypeDesc : Record<AccountTypeEnum, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Conta Poupança',
  INVESTMENT: 'Conta Investimento',
  LOAN: 'Empréstimo',
  OTHER: 'Outro'
}
@Pipe({
  name: 'accountType',
  standalone: true
})
export class AccountTypePipe implements PipeTransform {

  transform(value: AccountTypeEnum): string {
    return AccountTypeDesc[value];
  }

}
