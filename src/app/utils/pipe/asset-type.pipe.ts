import { Pipe, PipeTransform } from '@angular/core';
import { AssetDesc, AssetEnum } from '../../model/source.model';

@Pipe({
  name: 'assetType',
  standalone: true
})
export class AssetTypePipe implements PipeTransform {

  transform(value: AssetEnum): string {
    return AssetDesc[value];
  }

}
