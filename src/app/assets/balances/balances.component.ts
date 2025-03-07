import { Component, inject, Input, signal, WritableSignal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { tap } from 'rxjs';
import { AccountBalanceExchange, AccountTypeEnum, Currency } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';

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
  
  totalBalance: WritableSignal<number> = signal(0);
  totalBalanceChecking: WritableSignal<number> = signal(0);

  balances = this.contaService.getBalancesByCurrencyExchange(this.currency).pipe(
    tap(item=>{
      this.actives = item.slice();
      this.totalBalance.set(this.summarize(this.actives));
      this.totalBalanceChecking.set(this.summarize(this.actives.filter(item => item.type === AccountTypeEnum.CHECKING)));
    })
  )

  actives: AccountBalanceExchange[] = [];

  summarize(balances: AccountBalanceExchange[]) {
    return balances
      .map(item => item.exchange.amount)
      .reduce((acc, vl) => acc += vl, 0);
  }

  rowClicked(account: AccountBalanceExchange) {
    if (this.isNotActivated(account)) {
      this.actives.push(account);
    }
    else {
      this.actives = this.actives.filter(b => b!== account);
    }
    this.totalBalance.set(this.summarize(this.actives));
    this.totalBalanceChecking.set(this.summarize(this.actives.filter(item => item.type === AccountTypeEnum.CHECKING)));
  }

  isNotActivated(account: AccountBalanceExchange) {
    return ! this.actives.includes(account);
  }

  isSameCurrency(item: AccountBalanceExchange) {
    return this.currency === item.balance.currency;
  }

}
