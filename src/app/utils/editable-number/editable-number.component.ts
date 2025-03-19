import { DecimalPipe } from '@angular/common';
import { Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-editable-number',
  templateUrl: './editable-number.component.html',
  styleUrls: ['./editable-number.component.css'],
  standalone: true,
  imports: [DecimalPipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => EditableNumberComponent),
    },
    DecimalPipe
  ]
})
export class EditableNumberComponent implements OnInit, OnChanges, ControlValueAccessor {
  private _value: number = 0;
  @Input()
  public get value(): number {
    return this._value;
  }
  public set value(value: number) {
    this._value = value;
  }
  isEditing: boolean = false;
  
  @Input() step: any;
  @Input() min: any;
  @Input() max: any;
  @Input() disabled: boolean = false;

  @Input() numberFormat = '1.2-2';
  onTouched: any = () => {};
  touched: boolean = false;

  constructor(private decimalPipe: DecimalPipe) {}
  
  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
  }

  markAsTouched() {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
  }

  onChange = (value: number) => {};

  writeValue(value: number): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.disabled) {
      this.isEditing = false;
    }
  }


  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  updateNumber(event: Event) {
    const parsed = parseFloat((event.target as HTMLInputElement)?.value || '');
    if (!isNaN(parsed)) {
      const changed = this.value !== parsed;
      this.value = parsed;
      if (changed) {
        this.onChange(this.value);
      }
    }
  }
}
