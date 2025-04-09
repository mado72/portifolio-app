import { Pipe, PipeTransform } from '@angular/core';
import { Scheduled } from '../../model/domain.model';

const LABELS : Record<`${Scheduled}`, string> = {
  "ONCE" : 'Uma vez',
  "DIARY" : 'Diário',
  "WEEKLY" : 'Semanal',
  "FORTNIGHTLY": 'Quinzenal',
  "MONTHLY" : 'Mensal',
  "HALF_YEARLY": "Semestral",
  "QUARTER" : 'Trimestral',
  "YEARLY" : 'Anual'
}

@Pipe({
  name: 'scheduled',
  standalone: true
})
export class ScheduledPipe implements PipeTransform {

  transform(value: Scheduled): string {
    return LABELS[value];
  }

}
