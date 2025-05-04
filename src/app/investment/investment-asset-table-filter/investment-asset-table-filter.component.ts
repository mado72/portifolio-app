import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AssetEnum } from '../../model/source.model';
import { MarketPlaceEnum } from '../../model/investment.model';
import { AssetTypePipe } from '../../utils/pipe/asset-type.pipe';

@Component({
  selector: 'app-investment-asset-table-filter',
  templateUrl: './investment-asset-table-filter.component.html',
  styleUrls: ['./investment-asset-table-filter.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    AssetTypePipe
  ]
})
export class InvestmentAssetTableFilterComponent implements OnInit {

  private activatedRoute = inject(ActivatedRoute);

  private router = inject(Router);

  name: string = '';

  marketPlace: string = '';

  ticker: string = '';

  type: string = '';

  marketPlaces = Object.values(MarketPlaceEnum);

  types = Object.values(AssetEnum);

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.name = params['name'] || '';
      this.marketPlace = params['marketPlace'] || '';
      this.ticker = params['ticker'] || '';
      this.type = params['type'] || '';
    });
  }

  onFilterChange(field: keyof InvestmentAssetTableFilterComponent, value: string) {
    this[field] = value as any; // Atualiza o campo dinamicamente
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        name: this.name,
        marketPlace: this.marketPlace,
        ticker: this.ticker,
        type: this.type
      },
      queryParamsHandling: 'merge'
    });
  }

  handleInput(event: Event, field: string) {
    const input = event.target as HTMLInputElement;
    this.onFilterChange(field as keyof InvestmentAssetTableFilterComponent, input.value);
  }
}