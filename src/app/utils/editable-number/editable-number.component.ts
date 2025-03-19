import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-editable-number',
  templateUrl: './editable-number.component.html',
  styleUrls: ['./editable-number.component.css'],
  standalone: true,
  imports: [DecimalPipe]
})
export class EditableNumberComponent {
  @Input() number: number = 0;
  isEditing: boolean = false;
  
  @Input() step: any;
  @Input() min: any;
  @Input() max: any;

  @Input() numberFormat = '1.2-2';

  constructor(private decimalPipe: DecimalPipe) {}

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  updateNumber(event: Event) {
    this.isEditing = false;
    const parsed = parseFloat((event.target as HTMLInputElement)?.value || '');
    if (!isNaN(parsed)) {
      this.number = parsed;
    }
  }
}
