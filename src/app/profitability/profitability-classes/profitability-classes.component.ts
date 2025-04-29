import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { format, getMonth, setMonth } from 'date-fns';
import { ProfitabilityService } from '../../service/profitalibilty.service';

@Component({
  selector: 'app-profitability-classes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './profitability-classes.component.html',
  styleUrl: './profitability-classes.component.scss'
})
export class ProfitabilityClassesComponent {

  private fb = inject(FormBuilder);

  private profitabilityService = inject(ProfitabilityService);

  @Output() onCellChange = new EventEmitter<{ month: number, classify: string, value: number }>();

  historical = this.profitabilityService.historical;

  current = this.profitabilityService.current;

  currentMonth = getMonth(new Date());

  months = new Array(12).fill(12, 0).map((_, i) => {
    return i;
  });

  monthNames = this.months.map((month) => {
    return format(setMonth(new Date(), month), 'MMMM');
  });

  dataSource = input<{classify: string; values: number[];}[]>();

  // computed(() => {
  //   const current = this.current();
  //   const currentMonth = this.currentMonth;
  //   const historical = this.historical();
  //   return Object.entries(historical).reduce((acc, entry) => {
  //     const [classify, values] = entry;
  //     acc.push({
  //       classify: classify, 
  //       values: values.reduce((acc, value, index) => {
  //         acc.push(index >= currentMonth ? current[classify] || 0 : value);
  //         return acc;
  //       }, [] as number[])
  //     });
  //     return acc;
  //   }, [] as { classify: string, values: number[] }[]);
  // });

  classifies = input<string[]>();
  // computed(() => {
  //   return this.dataSource().map((item) => item.classify);
  // });

  form = computed(() => {
    const dataSource = this.dataSource() || [];
    return this.fb.group({
      rows: this.fb.array(dataSource.map((item) => {
        return this.fb.group({
          classify: item.classify,
          values: this.fb.array(item.values.map((value, month) => {
            return this.buildControl(value, item.classify, month);
          }))
        })
      }))
    })
  })

  constructor() { }

  private buildControl(value: number, classify: string, month: number) {
    const control = this.fb.control(value);
    control.valueChanges.subscribe((value) => {
      value = value || 0;
      this.onCellChange.emit({ month, classify, value });
    });
    return control;
  }

  tabIndex(row: number, month: number) {
    return row + (this.classifies()?.length || 0) * month + 1;
  }

  get rows() {
    return this.form().get('rows') as FormArray;
  }

  getRow(index: number) {
    return this.rows.at(index) as FormGroup;
  }

  getClassify(index: number) {
    return this.getRow(index).get('classify')?.value;
  }

  getValues(index: number) {
    return this.getRow(index).get('values') as FormArray;
  }

  getValue(index: number, month: number) {
    return this.getValues(index).at(month) as FormControl;
  }

}
