import { Component, inject, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { tap } from 'rxjs';
import { AccountBalanceQuote, Currency } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';

@Component({
  selector: 'app-saldos',
  standalone: true,
  imports: [
    MatTableModule,
    CurrencyComponent
  ],
  templateUrl: './saldos.component.html',
  styleUrl: './saldos.component.scss'
})
export class SaldosComponent {

  private contaService = inject(BalanceService);

  private _currency: Currency = Currency.BRL;

  public get currency(): Currency {
    return this._currency;
  }

  @Input()
  public set currency(value: Currency) {
    this._currency = value;
  }
  
  totalBalance: number = 0;

  balances = this.contaService.getBalanceQuotationByCurrency(this.currency).pipe(
    tap(item=>{
      this.totalBalance = 0;
      this.actives = item.slice();
      this.totalBalance = this.summarize(this.actives);
    })
  )

  actives: AccountBalanceQuote[] = [];

  summarize(balances: AccountBalanceQuote[]) {
    return balances
      .map(item => item.balanceQuote)
      .reduce((acc, vl) => acc += vl, 0);
  }

  rowClicked(account: AccountBalanceQuote): void {}

  isSameCurrency(balance: AccountBalanceQuote) {
    return this.currency === balance.currency;
  }
}
