import { DatePipe, JsonPipe } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AccountBalanceExchange, AccountTypeEnum } from '../../model/domain.model';
import { BalanceService } from '../../service/balance.service';
import { SourceService } from '../../service/source.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { QuoteService } from '../../service/quote.service';
import { ExchangeStructureType } from '../../model/investment.model';
import { BalanceType } from '../../model/source.model';
import { ExchangeComponent } from "../../utils/component/exchange/exchange.component";

type AccountBalanceExchangeSelectable = ReturnType<BalancesComponent["convertBalance"]>

@Component({
  selector: 'app-balances',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    CurrencyComponent,
    DatePipe,
    JsonPipe,
    ExchangeComponent
],
  templateUrl: './balances.component.html',
  styleUrl: './balances.component.scss'
})
export class BalancesComponent implements OnInit {

  private sourceService = inject(SourceService);

  private quoteService = inject(QuoteService);

  private balanceService = inject(BalanceService);

  currency = computed(()=> this.sourceService.currencyDefault());

  editable = input<boolean>(false);

  selects = signal<string[]>(
    this.balanceService.getBalancesByCurrencyExchange(
      Object.values(this.balanceService.getAllBalances()),
      this.currency()).map(item => item.id as string))

  balances = computed<Record<string, AccountBalanceExchangeSelectable>>(()=>
    Object.values(this.balanceService.getAllBalances())
      .map(balance=>this.convertBalance(balance))
      .reduce((acc, item) => {
        acc[item.id as string] = item;
        return acc;
      }, {} as Record<string, AccountBalanceExchangeSelectable>))

  dataSource = computed(() => [...Object.values(this.balances())
    .sort((balance1, balance2)=>balance1.accountName.localeCompare(balance2.accountName))
  ])

  convertBalance(item: BalanceType) {
    return {
      ...item,
      balance: this.quoteService.enhanceExchangeInfo(item.balance, item.balance.currency, ["value"]).value,
      selected: this.selects().includes(item.id as string)
    }
  }

  totalBalance = 0;

  totalBalanceChecking = 0;

  // readonly displayedColumn = ['account', 'balanceQuote', 'balance'];
  readonly displayedColumn = ['account', 'balanceQuote'];

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

  summarize(balances: AccountBalanceExchangeSelectable[]) {
    return balances
      .map(item => item.balance.exchanged.value)
      .reduce((acc, vl) => acc += vl, 0);
  }

  rowClicked(account: AccountBalanceExchangeSelectable) {
    this.toggleSelect(account);
  }

  toggleSelect(account: AccountBalanceExchangeSelectable) {
    this.selects.update(selects=>
      selects.includes(account.id as string)
        ? selects.filter(id => id !== account.id) 
        : [...selects, account.id as string]
    );
  }

  editAccount(account: AccountBalanceExchange) {
    this.balanceService.editAccount(account).subscribe();
  }

  newAccount() {
    this.balanceService.newAccount().subscribe(account=>{
      if (account) {
        this.selects.update(items=>[...items, account.id as string])
      }
    })
  }

  deleteAccount(account: AccountBalanceExchange) {
    this.balanceService.deleteAccount(account.id as string);
  }

  isSameCurrency(item: AccountBalanceExchange) {
    return this.currency() === item.balance.currency;
  }

}
