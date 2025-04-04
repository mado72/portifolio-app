import { Component, inject, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { tap } from 'rxjs';
import { AccountBalanceExchange, AccountTypeEnum, Currency } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { MatDialog } from '@angular/material/dialog';
import { BalanceDialogComponent } from '../balance-dialog/balance-dialog.component';

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
export class BalancesComponent implements OnInit {

  private balanceService = inject(BalanceService);

  private dialog = inject(MatDialog);

  currency: Currency = Currency.BRL;

  @Input() editEnable = false;
  
  totalBalance: WritableSignal<number> = signal(0);
  totalBalanceChecking: WritableSignal<number> = signal(0);

  balances = signal<AccountBalanceExchange[]>([]);

  actives: AccountBalanceExchange[] = [];

  ngOnInit(): void {
    this.reloadBalances();
  }

  reloadBalances() {
    const balances = this.balanceService.getBalancesByCurrencyExchange(this.currency);
    this.balances.set(balances);
    this.actives = balances.slice();
    this.totalBalance.set(this.summarize(this.actives));
    this.totalBalanceChecking.set(this.summarize(this.actives.filter(item => item.type === AccountTypeEnum.CHECKING)));
  }

  summarize(balances: AccountBalanceExchange[]) {
    return balances
      .map(item => item.exchange.price)
      .reduce((acc, vl) => acc += vl, 0);
  }

  rowClicked(account: AccountBalanceExchange) {
    if (! this.editEnable) {
      this.toggleSelect(account);
    }
    else {
      this.editAccount(account);
    }
  }

  toggleSelect(account: AccountBalanceExchange) {
    if (this.isNotActivated(account)) {
      this.actives.push(account);
    }
    else {
      this.actives = this.actives.filter(b => b !== account);
    }
    
    this.totalBalance.set(this.summarize(this.actives));
    this.totalBalanceChecking.set(this.summarize(this.actives.filter(item => item.type === AccountTypeEnum.CHECKING)));
  }

  editAccount(account: AccountBalanceExchange) {
    const dialogRef = this.dialog.open(BalanceDialogComponent, {
      data: {
        title: 'Editar Conta',
        account 
      }
    });

    dialogRef.afterClosed().subscribe((result: AccountBalanceExchange) => {
      if (result) {
        let account = this.balances().find(item => item.id === result.id);
        if (!account) {
          this.balanceService.addAccount(result);
        }
        else {
          this.balanceService.updateAccount(account.id, result);
        }
        this.reloadBalances();
      }
    });
  }

  isNotActivated(account: AccountBalanceExchange) {
    return ! this.actives.includes(account);
  }

  isSameCurrency(item: AccountBalanceExchange) {
    return this.currency === item.balance.currency;
  }

}
