import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { EarningsDesc, EarningsEnum } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';

@Component({
  selector: 'app-investment-earnings-details',
  standalone: true,
  imports: [
    MatTableModule,
    DatePipe,
    CurrencyComponent
  ],
  templateUrl: './investment-earnings-details.component.html',
  styleUrl: './investment-earnings-details.component.scss'
})
export class InvestmentEarningsDetailsComponent {

}
