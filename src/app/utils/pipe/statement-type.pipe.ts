import { Pipe, PipeTransform } from '@angular/core';
import { StatementDesc, StatementEnum } from '../../model/domain.model';

@Pipe({
  name: 'statementType',
  standalone: true
})
export class StatementTypePipe implements PipeTransform {

  transform(value: StatementEnum): string {
    return StatementDesc[value];
  }

}
