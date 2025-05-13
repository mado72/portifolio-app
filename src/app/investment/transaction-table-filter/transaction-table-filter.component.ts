import { Component, computed, EventEmitter, inject, input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetService } from '../../service/asset.service';
import { BalanceService } from '../../service/balance.service';
import { TransactionService } from '../../service/transaction.service';
import { InvestmentTypePipe } from '../../utils/pipe/investment-type.pipe';
import { endOfMonth, startOfMonth } from 'date-fns';

export type FilterType = {
  investmentType: string | null;
  marketPlace: string | null;
  ticker: string | null; // Adicionado o campo ticker
  start: Date | null;
  end: Date | null;
  accountId: string | null;
} 

@Component({
  selector: 'app-transaction-table-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    InvestmentTypePipe
  ],
  templateUrl: './transaction-table-filter.component.html',
  styleUrl: './transaction-table-filter.component.scss'
})
export class TransactionTableFilterComponent implements OnInit {

  private activatedRoute = inject(ActivatedRoute);

  private router = inject(Router);

  private fb = inject(FormBuilder);

  private transactionService = inject(TransactionService);

  private assetService = inject(AssetService);

  private balanceService = inject(BalanceService);

  readonly filter = input<Partial<FilterType>>({});

  @Output() filterChange = new EventEmitter<FilterType>();

  readonly investmentTypes = this.transactionService.getInvestmentTypes();

  readonly marketPlaces = this.assetService.getMarketPlaces();

  readonly accounts = computed(() => Object.values(this.balanceService.getAllBalances()));

  filterForm = this.fb.group({
    investmentType: [this.filter().investmentType || null],
    marketPlace: [this.filter().marketPlace || null], // Atualizado para usar o valor do filtro
    ticker: [this.filter().ticker || ''], // Atualizado para usar o valor do filtro
    range: this.fb.group({
      start: [this.filter().start || null as Date | null],
      end: [this.filter().end || null as Date | null]
    }),
    account: [this.filter().accountId ? { id: this.filter().accountId } : null]
  });

  constructor() {
    this.filterForm.valueChanges.subscribe((value) => {
      const filter: FilterType = {
        investmentType: value.investmentType || null,
        marketPlace: value.marketPlace || null,
        ticker: value.ticker || null, // Adicionado para enviar o valor do ticker
        start: value.range?.start ?? null,
        end: value.range?.end ?? null,
        accountId: value.account?.id ?? null
      };
      this.filterChange.emit(filter);
    }
    );
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.filterForm.patchValue({
        investmentType: params['investmentType'] || null,
        marketPlace: params['marketPlace'] || null,
        ticker: params['ticker'] || '', // Adicionado para preencher o valor inicial do ticker
        range: {
          start: params['start'] ? new Date(params['start']) : startOfMonth(new Date()),
          end: params['end'] ? new Date(params['end']): null,
        },
        account: params['account'] ? { id: params['account'] } : null
      });
    });

    this.filterForm.valueChanges.subscribe((value) => {
      this.router.navigate([], {
        queryParams: {
          investmentType: value.investmentType,
          marketPlace: value.marketPlace,
          ticker: value.ticker || null, // Adicionado para enviar o valor do ticker
          start: value.range?.start ?? null,
          end: value.range?.end ?? null,
          account: value.account?.id ?? null
        }
      });
    });
  }

}
