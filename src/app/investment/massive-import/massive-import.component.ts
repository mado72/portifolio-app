import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { concat, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { Currency } from '../../model/domain.model';
import { InvestmentEnum, TransactionStatus } from '../../model/investment.model';
import { PortfolioType } from '../../model/source.model';
import { AssetService } from '../../service/asset.service';
import { BalanceService } from '../../service/balance.service';
import { PortfolioService } from '../../service/portfolio-service';
import { TransactionService } from '../../service/transaction.service';
import { isAccountMatchedValidator } from '../../utils/validator/custom.validator';

type ImportType = {
  portfolio: string;
  asset: string;
  quantity: number;
  value: number;
  currency: string;
  date: string;
}

@Component({
  selector: 'app-massive-import',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatAutocompleteModule,
    NgTemplateOutlet,
    JsonPipe
  ],
  templateUrl: './massive-import.component.html',
  styleUrl: './massive-import.component.scss'
})
export class MassiveImportComponent {

  private fb = inject(FormBuilder);

  private portolioService = inject(PortfolioService);

  private assetService = inject(AssetService);

  private transactionService = inject(TransactionService);

  private balanceService = inject(BalanceService);

  accounts = computed(() => this.balanceService.getAccounts());
  
  accountName = signal('');

  optionsAccount = computed(() => {
    const accountName = this.accountName();
    return this.accounts()
      .filter(acc => acc.account.toLocaleLowerCase().includes(accountName.toLocaleLowerCase()));
  });

  accountNameDisplay = (id: string): string => this.accounts()
    .filter(acc => acc.id === id)
    .map(acc => acc.account).find(_ => true) || '';

  form = this.fb.group({
    data: ['', [Validators.required, Validators.minLength(4)]],
    accountId: ['', Validators.required, isAccountMatchedValidator(this.accounts)]
  });

  parsed: ImportType[] | null = null;
  
  error: string[] | null = null;

  constructor() {
    this.listenDataField();
    this.listenAccountIdToFillAccountName
  }

  private listenDataField() {
    this.form.get('data')?.valueChanges.subscribe((value) => {
      try {
        this.parsed = value === null ? null : this.analyse(value);
        console.log(this.parsed);
        this.error = null;
      } catch (error: any) {
        this.error = [error.message];
        this.parsed = null;
      }
      this.form.get('data')?.setErrors(this.error ? { invalid: true } : null);
    });
  }

  private listenAccountIdToFillAccountName() {
    const accountIdField = this.form.get("accountId") as FormControl;
    accountIdField.valueChanges.pipe(
      startWith(accountIdField.value),
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(accountName => this.accountName.set(accountName));
  }

  import() {
    if (!this.form.valid) {
      return
    }

    type ImportPortfolioData = Record<string, {
      assets: [{
        asset: string;
        quantity: number;
        value: number;
        date: Date;
      }]
      currency: Currency;
      portfolio: string;
    }>;

    const portfoliosMap : ImportPortfolioData = (this.parsed || []).reduce((acc: ImportPortfolioData, item: ImportType) => {
      const portfolio = acc[item.portfolio] || {
        portfolio: item.portfolio,
        currency: item.currency,
        assets: [],
        total: {
          quantity: 0,
          value: 0,
          currency: item.currency
        }
      };
      portfolio.assets.push({
        asset: item.asset,
        quantity: item.quantity,
        value: item.value,
        date: new Date(item.date),
      });
      acc[item.portfolio] = portfolio;
      return acc;
    }, {} as ImportPortfolioData);

    const porfolios = Object.values(this.portolioService.portfolios()).reduce((acc, portfolio) => {
      acc[portfolio.name] = portfolio;
      return acc;
    }, {} as Record<string, PortfolioType>);

    const observables = Object.values(portfoliosMap).flatMap((item) => {
      let portfolio = Object.values(porfolios).find((port) => port.name === item.portfolio);
      if (!portfolio) {
        const raw = this.portolioService.addPortfolio({ name: item.portfolio, percPlanned: 0, currency: item.currency, classify: '' });
        portfolio = this.portolioService.portfolios()[raw.id];
      }
      if (!portfolio) {
        throw new Error('Portfolio not found or created');
      }

      return Object.values(item.assets).map((asset) => {
        return this.transactionService.saveTransaction({
          ticker: asset.asset,
          value: {
            currency: item.currency,
            value: asset.value / asset.quantity
          },
          quantity: asset.quantity,
          date: asset.date,
          status: TransactionStatus.PENDING,
          type: InvestmentEnum.BUY,
          accountId: this.form.get('accountId')?.value as string,
          id: '',
          quote: asset.value / asset.quantity,

        }, {
          [portfolio.id]: asset.quantity
        });
      });
    });

    concat(...observables).subscribe();
  }

  analyse(data: any) {
    const json = JSON.parse(data);
    this.error = [];

    if (!Array.isArray(json)) {
      this.error.push('O JSON não é um array');
      return null;
    }

    json.forEach((item: any, index) => {
      if (!this.isNumber(item.quantity)) {
        this.error?.push(`Item no índice ${index} tem um valor de quantidade inválido`);
        return;
      }
      if (!this.isNumber(item.value)) {
        this.error?.push(`Item no índice ${index} tem um valor de valor inválido`);
        return;
      }
      if (isNaN(Date.parse(item.date))) {
        this.error?.push(`Item no índice ${index} tem uma data inválida`);
        return;
      }
      const [marketPlace, code] = item.asset.split(':');
      if (!marketPlace || !code) {
        this.error?.push(`Item no índice ${index} tem um ativo inválido`);
        return;
      }
      item.quantity = Number(item.quantity.replace(/,/, '.'));
      item.value = Number(item.value.replace(/,/, '.'));
      item.date = new Date(item.date).toISOString().split('T')[0];
      item.portfolio = item.portfolio.trim();
      item.asset = item.asset.trim();
      item.currency = item.currency.trim().toUpperCase();
      
      if (!this.isImportType(item)) {
        this.error?.push(`Item no índice ${index} não é um objeto ImportType válido`);
        return;
      }
    });

    if (this.error.length > 0) {
      throw new Error(this.error.join('\n'));
    }

    return json as ImportType[];
  }

  private isImportType(item: any): item is ImportType {
    return (
      typeof item.portfolio === 'string' &&
      typeof item.asset === 'string' &&
      typeof item.quantity === 'number' &&
      typeof item.value === 'number' &&
      typeof item.currency === 'string' &&
      typeof item.date === 'string'
    );
  }

  private isNumber(value: any): value is number {
    return !isNaN(Number(value.replace(/,/, '.')));
  }

}
