import { DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { Income, IncomeDesc, IncomeEnum } from '../../model/investment.model';
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

  @Input() selectable = false;

  selected : Income | undefined = undefined;

  @Output() itemSelected = new EventEmitter<Income>();

  private _dataSource: Income[] = [];
  @Input()
  public get dataSource(): Income[] {
    return this._dataSource;
  }
  public set dataSource(earnings: Income[]) {
    this._dataSource = earnings.map(earning => {
        const asserts = this.investmentService.assertsSignal();
        return {
          ...earning,
          currency: asserts[earning.ticker].quote.currency,
          description: asserts[earning.ticker].name
        }
      });
  }

  earningsEnum = IncomeEnum;

  readonly displayedColumns = ["id", "ticker", "description", "type", "date", "amount"];

  getEarningEnumDisplayName(type: IncomeEnum) {
    return IncomeDesc[type];
  }

  rowClicked(row: Income) {
    this.selected = row;
    this.itemSelected.emit(row);
  }

}
