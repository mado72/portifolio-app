import { Component, inject, Input } from '@angular/core';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { MatTableModule } from '@angular/material/table';
import { BalanceService } from '../../service/balance.service';
import { AccountBalanceQuote, Currency } from '../../model/domain.model';
import { tap } from 'rxjs';

@Component({
  selector: 'app-balances',
  standalone: true,
  imports: [
    MatTableModule,
    CurrencyComponent
  ],
  templateUrl: './balances.component.html',
  styleUrl: './balances.component.scss'
})
export class BalancesComponent {

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
