import { Component, computed, inject, OnInit } from '@angular/core';
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

  readonly investmentTypes = this.transactionService.getInvestmentTypes();

  readonly marketPlaces = this.assetService.getMarketPlaces();

  readonly accounts = computed(() => Object.values(this.balanceService.getAllBalances()));

  filterForm = this.fb.group({
    investmentType: [null],
    marketPlace: [null],
    range: this.fb.group({
      start: [null as Date | null],
      end: [null as Date | null]
    }),
    account: [null as { id: string } | null]
  });

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.filterForm.patchValue({
        investmentType: params['investmentType'] || null,
        marketPlace: params['marketPlace'] || null,
        range: {
          start: params['start'] ? new Date(params['start']) : null,
          end: params['end'] ? new Date(params['end']) : null,
        },
        account: params['account'] ? { id: params['account'] } : null
      });
    });

    this.filterForm.valueChanges.subscribe((value) => {
      this.router.navigate([], {
        queryParams: {
          investmentType: value.investmentType,
          marketPlace: value.marketPlace,
          start: value.range?.start ?? null,
          end: value.range?.end ?? null,
          account: value.account?.id ?? null
        }
      });
    });
  }

}
