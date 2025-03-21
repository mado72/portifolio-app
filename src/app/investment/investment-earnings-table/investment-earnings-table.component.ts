import { DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { Earning, EarningsDesc, EarningEnum } from '../../model/investment.model';
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

  selected : Earning | undefined = undefined;

  @Output() itemSelected = new EventEmitter<Earning>();

  private _dataSource: Earning[] = [];
  @Input()
  public get dataSource(): Earning[] {
    return this._dataSource;
  }
  public set dataSource(earnings: Earning[]) {
    this._dataSource = earnings.map(earning => {
        const asserts = this.investmentService.assertsSignal();
        return {
          ...earning,
          currency: asserts[earning.ticket].quote.currency,
          description: asserts[earning.ticket].name
        }
      });
  }

  earningsEnum = EarningEnum;

  readonly displayedColumns = ["id", "ticket", "description", "type", "date", "amount"];

  getEarningEnumDisplayName(type: EarningEnum) {
    return EarningsDesc[type];
  }

  rowClicked(row: Earning) {
    this.selected = row;
    this.itemSelected.emit(row);
  }

}
