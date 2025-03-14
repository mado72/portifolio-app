import { Pipe, PipeTransform } from '@angular/core';
import { AssetEnum } from '../model/investment.model';

type AssetEnumType = `${AssetEnum}`
const AssetCode : Record<AssetEnumType, string> = {
  STOCK: 'Ação',
  BOND: 'Fundo',
  ETF: 'ETF',
  CRYPTO: 'Crypto',
  REAL_ESTATE: 'FI',
  CURRENCY: 'Moeda',
  OTHER: 'Outro'
}
@Pipe({
  name: 'assetType',
  standalone: true
})
export class AssetTypePipe implements PipeTransform {

  transform(value: AssetEnum): string {
    return AssetCode[value as AssetEnumType];
  }

}
