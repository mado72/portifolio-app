import { Pipe, PipeTransform } from '@angular/core';
import { InvestmentEnum, InvestmentEnumDesc } from '../../model/investment.model';

@Pipe({
  name: 'investmentType',
  standalone: true
})
export class InvestmentTypePipe implements PipeTransform {

  transform(value: InvestmentEnum | string, display?: string): string {
    const k = typeof value === 'string' ? InvestmentEnum[value as keyof typeof InvestmentEnum] : value;
    if (display === 'short') {
      return InvestmentAbrev[k];
    }
    return InvestmentEnumDesc[k];
  }

}

const InvestmentAbrev : Record<`${InvestmentEnum}`, string> = {
    "BUY": 'C',
    "SELL": 'V',
    "DIVIDENDS": 'Dvds',
    "RENT_RETURN": 'Alg',
    "IOE_RETURN": 'JCP',
    "TRANSFER": 'Trnsf',
    "SUBSCRIPTION": 'Subs',
    "REDEMPTION": 'Rsgt',
    "OTHER": 'Otrs',
}
