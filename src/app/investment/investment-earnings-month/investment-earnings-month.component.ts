import { ChangeDetectionStrategy, Component, inject, LOCALE_ID, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Income } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { provideAppDateAdapter } from '../../utils/app-date-adapter.adapter';
import { InvestmentEarningsTableComponent } from '../investment-earnings-table/investment-earnings-table.component';
import { provideNativeDateAdapter } from '@angular/material/core';


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
    ReactiveFormsModule
  ],
  encapsulation: ViewEncapsulation.None,
  providers: [
    provideNativeDateAdapter(MONTH_FORMATS),
    { provide: LOCALE_ID, useValue: 'pt'},
  ],
  templateUrl: './investment-earnings-month.component.html',
  styleUrl: './investment-earnings-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvestmentEarningsMonthComponent implements OnInit {

  private investmentService = inject(InvestmentService);
  
  date = new FormControl(new Date());

  earnings: Income[] = [];

  ngOnInit(): void {
    this.doFilter();
  }

  doFilter() {
    const date = this.date.value as Date;
    this.earnings = this.investmentService.findIncomesBetween(startOfMonth(date), endOfMonth(date));
  }

  setMonthAndYear($date: Date, datePicker: MatDatepicker<any>) {
    this.date.setValue($date);

    datePicker.close();
    this.doFilter();
  }
}
