import { Component, Input } from '@angular/core';
import { faDownLong, faUpDown, faUpLong } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TrendType } from '../../model/source.model';

@Component({
  selector: 'app-trend',
  standalone: true,
  imports: [
    FontAwesomeModule
  ],
  templateUrl: './trend.component.html',
  styleUrl: './trend.component.scss'
})
export class TrendComponent {

  readonly downIcon = faDownLong;
  readonly upIcon = faUpLong;
  readonly unchangedIcon = faUpDown;

  @Input() trend!: TrendType;

  get icon() {
    return this.trend === 'up'? this.upIcon : this.trend === 'down'? this.downIcon : this.unchangedIcon;
  }

  get color() {
    return this.trend === 'up'? 'green' : this.trend === 'down'?'red' : 'gray';
  }

}
