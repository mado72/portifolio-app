import { Pipe, PipeTransform } from '@angular/core';
import { Recurrence } from '../../model/domain.model';

const LABELS : Record<`${Recurrence}`, string> = {
  "ONCE" : 'Uma vez',
  "DIARY" : 'Diário',
  "WEEKLY" : 'Semanal',
  "MONTHLY" : 'Mensal',
  "YEARLY" : 'Anual'
}

@Pipe({
  name: 'recurrence',
  standalone: true
})
export class RecurrencePipe implements PipeTransform {

  transform(value: Recurrence): string {
    return LABELS[value];
  }

}
