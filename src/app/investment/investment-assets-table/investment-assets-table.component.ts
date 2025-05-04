import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal, TrackByFunction } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faXmarkCircle } from '@fortawesome/free-solid-svg-icons';
import { AssetQuoteType } from '../../model/source.model';
import { AssetService } from '../../service/asset.service';
import { PortfolioService } from '../../service/portfolio-service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { AssetTypePipe } from '../../utils/pipe/asset-type.pipe';
import { TrendComponent } from '../../utils/trend/trend.component';
import { ActivatedRoute } from '@angular/router';
import { InvestmentAssetTableFilterComponent } from '../investment-asset-table-filter/investment-asset-table-filter.component';

@Component({
  selector: 'app-investment-assets-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    DatePipe,
    FontAwesomeModule,
    CurrencyComponent,
    TrendComponent,
    InvestmentAssetTableFilterComponent,
    AssetTypePipe
  ],
  templateUrl: './investment-assets-table.component.html',
  styleUrl: './investment-assets-table.component.scss'
})
export class InvestmentAssetsTableComponent implements OnInit {

  private activatedRoute = inject(ActivatedRoute);

  private assetService = inject(AssetService);

  private portfolioService = inject(PortfolioService);

  editable = input<boolean>(false);

  datasource = computed(() => {
    const assets = Object.values(this.assetService.assets())
      .filter(asset => {
        const filterCriteria = this.filterCriteria();
        return (!filterCriteria.name || asset.name.toLowerCase().includes(filterCriteria.name.toLowerCase())) &&
          (!filterCriteria.marketPlace || asset.ticker.startsWith(filterCriteria.marketPlace)) &&
          (!filterCriteria.ticker || asset.ticker.toLowerCase().includes(filterCriteria.ticker.toLowerCase())) &&
          (!filterCriteria.type || asset.type === filterCriteria.type);
      })
      .sort((a, b) => a.type.localeCompare(b.type) || a.ticker.localeCompare(b.ticker))
      .map(asset => ({
        ...asset,
        deletable: this.editable() && (this.portfolioService.portfoliosOfAsset(asset)?.length || 0) < 1
      }))
    return assets;
  });

  readonly iconTrue = faCircleCheck;

  readonly iconFalse = faXmarkCircle;

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'trend', 'lastUpdate', 'controlByQty', 'manualQuote'];

  filterCriteria = signal({
    name: '',
    marketPlace: '',
    ticker: '',
    type: ''
  });

  ngOnInit() {
    if (this.editable()) {
      this.displayedColumns.push('actions');
    }
    this.activatedRoute.queryParams.subscribe(params => {

      this.filterCriteria.update(filterCriteria => {
        filterCriteria.name = params['name'] || '';
        filterCriteria.marketPlace = params['marketPlace'] || '';
        filterCriteria.ticker = params['ticker'] || '';
        filterCriteria.type = params['type'] || '';
        return {...filterCriteria};
      });
    });
  }

  trackByFn: TrackByFunction<AssetQuoteType> = (index: number, item: AssetQuoteType) => {
    return item.ticker;
  };
  editAsset(asset: AssetQuoteType) {
    this.assetService.editDialog(asset);
  }

  newAsset() {
    this.assetService.newDialog().subscribe();
  }

  deleteAsset(asset: AssetQuoteType) {
    this.assetService.deleteAsset(asset.ticker);
  }

}
