import { Component, inject, Input, signal, WritableSignal } from '@angular/core';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { MatTableModule } from '@angular/material/table';
import { BalanceService } from '../../service/balance.service';
import { AccountBalanceQuote, AccountTypeEnum, Currency } from '../../model/domain.model';
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
  
  totalBalance: WritableSignal<number> = signal(0);
  totalBalanceChecking: WritableSignal<number> = signal(0);

  balances = this.contaService.getBalanceQuotationByCurrency(this.currency).pipe(
    tap(item=>{
      this.actives = item.slice();
      this.totalBalance.set(this.summarize(this.actives));
      this.totalBalanceChecking.set(this.summarize(this.actives.filter(item => item.type === AccountTypeEnum.CHECKING)));
    })
  )

  actives: AccountBalanceQuote[] = [];

  summarize(balances: AccountBalanceQuote[]) {
    return balances
      .map(item => item.balanceQuote)
      .reduce((acc, vl) => acc += vl, 0);
  }

  rowClicked(account: AccountBalanceQuote) {
    if (this.isNotActivated(account)) {
      this.actives.push(account);
    }
    else {
      this.actives = this.actives.filter(b => b!== account);
    }
    this.totalBalance.set(this.summarize(this.actives));
    this.totalBalanceChecking.set(this.summarize(this.actives.filter(item => item.type === AccountTypeEnum.CHECKING)));
  }

  isNotActivated(account: AccountBalanceQuote) {
    return ! this.actives.includes(account);
  }

  isSameCurrency(balance: AccountBalanceQuote) {
    return this.currency === balance.currency;
  }

}
