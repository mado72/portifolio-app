import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { EarningsDesc, EarningsEnum } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';


@Component({
  selector: 'app-investment-earnings-table',
  standalone: true,
  imports: [
    MatTableModule,
    DatePipe,
    CurrencyComponent    
  ],
  templateUrl: './investment-earnings-table.component.html',
  styleUrl: './investment-earnings-table.component.scss'
})
export class InvestmentEarningsTableComponent {

  private investmentService = inject(InvestmentService);

  dataSource = this.investmentService.findEarningsBetween(new Date(), new Date()).pipe(
    map(earnings => earnings.map(earning => {
      const asserts = this.investmentService.assertsSignal();
      return {
        ...earning,
        currency: asserts[earning.ticket].quote.currency,
        description: asserts[earning.ticket].name
      }
    })
  ));

  earningsEnum = EarningsEnum;

  readonly displayedColumns = ["id", "ticket", "description", "type", "date", "amount"];

  getEarningEnumDisplayName(type: EarningsEnum) {
    return EarningsDesc[type];
  }

}
