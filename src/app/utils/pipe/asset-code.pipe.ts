import { Pipe, PipeTransform } from '@angular/core';
import { getMarketPlaceCode } from '../../service/quote.service';

@Pipe({
  name: 'assetCode',
  standalone: true
})
export class AssetCodePipe implements PipeTransform {

  transform(value: {marketPlace: string, code: string}): string | null {
    if (! value) {
      return null;
    }
    return getMarketPlaceCode({ marketPlace: value.marketPlace, code: value.code });
  }

}
