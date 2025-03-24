import { Pipe, PipeTransform } from '@angular/core';
import { Asset } from '../model/investment.model';
import { getMarketPlaceCode } from '../service/quote.service';

@Pipe({
  name: 'assetCode',
  standalone: true
})
export class AssetCodePipe implements PipeTransform {

  transform(value: {marketPlace: string, code: string}): string {
    return getMarketPlaceCode({ marketPlace: value.marketPlace, code: value.code });
  }

}
