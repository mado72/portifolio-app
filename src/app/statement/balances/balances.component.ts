import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { AccountBalanceExchange, AccountTypeEnum, Currency } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { SourceService } from '../../service/source.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { MatIconModule } from '@angular/material/icon';

type AccountBalanceExchangeSelectable = AccountBalanceExchange & {
  selected: boolean;
}

@Component({
  selector: 'app-balances',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    CurrencyComponent,
    DatePipe
  ],
  templateUrl: './balances.component.html',
  styleUrl: './balances.component.scss'
})
export class BalancesComponent implements OnInit {

  private sourceService = inject(SourceService);

  private balanceService = inject(BalanceService);

  currency = this.sourceService.currencyDefault;

  editable = input<boolean>(false);

  selects = signal<string[]>(
    this.balanceService.getBalancesByCurrencyExchange(this.currency())
      .map(item => item.id))

  balances = computed<Record<string, AccountBalanceExchangeSelectable>>(()=>
    this.balanceService.getBalancesByCurrencyExchange(this.currency())
      .reduce((acc, item) => {
        acc[item.id] = { ...item, selected: this.selects().includes(item.id) };
        return acc;
      }, {} as Record<string, AccountBalanceExchangeSelectable>))

  dataSource = computed(() => [...Object.values(this.balances())
    .sort((balance1, balance2)=>balance1.account.localeCompare(balance2.account))
  ])

  totalBalance = 0;

  totalBalanceChecking = 0;

  readonly displayedColumn = ['account', 'balanceQuote', 'balance'];

  constructor() {
    effect(()=> {
      this.totalBalance = this.summarize(this.dataSource().filter(item => item.selected))

      this.totalBalanceChecking = this.summarize(this.dataSource()
        .filter(item => item.selected && item.type === AccountTypeEnum.CHECKING))
    })
  }
  
  ngOnInit(): void {
    if (this.editable()) {
      this.displayedColumn.push('actions');
    }
  }

  summarize(balances: AccountBalanceExchange[]) {
    return balances
      .map(item => item.exchange.price)
      .reduce((acc, vl) => acc += vl, 0);
  }

  rowClicked(account: AccountBalanceExchangeSelectable) {
    this.toggleSelect(account);
  }

  toggleSelect(account: AccountBalanceExchangeSelectable) {
    this.selects.update(selects=>
      selects.includes(account.id)
        ? selects.filter(id => id!== account.id) 
        : [...selects, account.id]
    );
  }

  editAccount(account: AccountBalanceExchange) {
    this.balanceService.editAccount(account);
  }

  newAccount() {
    this.balanceService.newAccount();
  }

  deleteAccount(account: AccountBalanceExchange) {
    this.balanceService.deleteAccount(account.id);
  }

  isSameCurrency(item: AccountBalanceExchange) {
    return this.currency() === item.balance.currency;
  }

}
