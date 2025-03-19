import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Earning } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { AppDateAdapter, provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';
import { InvestmentEarningsTableComponent } from '../investment-earnings-table/investment-earnings-table.component';


const MONTH_FORMATS = {
  parse: {
    dateInput: 'MM/yyyy',
  },
  display: {
    dateInput: 'MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

@Component({
  selector: 'app-investment-earnings-month',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    InvestmentEarningsTableComponent,
    FormsModule,
    ReactiveFormsModule,
    DatePipe
  ],
  encapsulation: ViewEncapsulation.None,
  providers: [
    provideAppDateAdapter(MONTH_FORMATS),
  ],
  templateUrl: './investment-earnings-month.component.html',
  styleUrl: './investment-earnings-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvestmentEarningsMonthComponent {

  private investmentService = inject(InvestmentService);
  
  date = new FormControl(new Date());

  earnings: Earning[] = [];

  doFilter() {
    const date = this.date.value as Date;
    this.investmentService.findEarningsBetween(startOfMonth(date), endOfMonth(date))
      .subscribe(earnings => this.earnings = earnings);
  }

  setMonthAndYear($date: Date, datePicker: MatDatepicker<any>) {
    this.date.setValue($date);

    datePicker.close();
    this.doFilter();
  }
}
