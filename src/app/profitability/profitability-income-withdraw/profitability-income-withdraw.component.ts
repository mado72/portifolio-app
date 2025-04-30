import { JsonPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { InvestmentEnum, TransactionStatus } from '../../model/investment.model';
import { InvestmentTransactionType } from '../../model/source.model';
import { AssetService } from '../../service/asset.service';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { SourceService } from '../../service/source.service';
import { TransactionService } from '../../service/transaction.service';
import { concat } from 'rxjs';
import { getMonth, getYear } from 'date-fns';
import { CellData, RowData } from '../../utils/component/financial-grid/financial-gird.model';
import { ExchangeService } from '../../service/exchange.service';
import { FinancialGridComponent } from '../../utils/component/financial-grid/financial-grid.component';

@Component({
  selector: 'app-profitability-income-withdraw',
  standalone: true,
  imports: [
    FinancialGridComponent,
    JsonPipe
  ],
  templateUrl: './profitability-income-withdraw.component.html',
  styleUrl: './profitability-income-withdraw.component.scss'
})
export class ProfitabilityIncomeWithdrawComponent {

  private exchangeService = inject(ExchangeService);

  private transactionService = inject(TransactionService);

  private profitabilityService = inject(ProfitabilityService);

  private assetService = inject(AssetService);

  withdraw = this.profitabilityService.withdraw();

  transactions = Object.values(this.transactionService.investmentTransactions());

  assets = this.assetService.assets();

  currentMonth = getMonth(new Date());

  incomesTransactions = computed(() => Object.values(this.transactionService.investmentTransactions())
    .filter(t => [InvestmentEnum.DIVIDENDS, InvestmentEnum.IOE_RETURN, InvestmentEnum.RENT_RETURN, InvestmentEnum.SELL].includes(t.type)
      && t.status === TransactionStatus.COMPLETED
      && getYear(t.date) === getYear(new Date()))
    .reduce((acc, t) => {
      const month = new Date(t.date).getMonth();
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(t);
      return acc;
    }, {} as { [month: number]: InvestmentTransactionType[] }));

  rows = computed(() => {
    const investmentsRecord = this.incomesTransactions();
    const currencyDefault = this.exchangeService.currencyDefault();

    return Object.entries(investmentsRecord).reduce((acc, [month, investments]) => {
      investments.forEach((investment) => {
        const accIdx = InvestmentEnum.SELL === investment.type ? 1 : 0;
        const value = this.exchangeService.exchange(investment.value.value, investment.value.currency, currencyDefault).value;
        const cell = acc[accIdx].cells[Number(month) % 12];
        if (cell && cell.value !== undefined) {
          cell.value = (cell.value || 0) + value;
        }
      });

      return acc;
    }, [{
      label: 'Proventos',
      disabled: false,
      operation: 'plus',
      cells: Array(12).fill(0).map(() => ({ value: 0, disabled: true })),
    }, {
      label: 'Resgate',
      disabled: false,
      operation: 'minus',
      cells: Array(12).fill(0).map((_,idx) => ({ value: 0, disabled: idx > this.currentMonth })),
    }] as RowData[]).map(row => {
      row.cells.forEach(cell=>cell.value = Math.round((cell.value || 0) * 100) / 100);
      return row;
    });

  });

  gridData = computed(() => {
    return {
      title: 'Rendimentos e Resgates',
      months: this.profitabilityService.months(),
      rows: this.rows()
    };
  });


}
