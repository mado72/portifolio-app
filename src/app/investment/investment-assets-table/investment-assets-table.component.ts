import { DatePipe, JsonPipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, TrackByFunction } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faXmarkCircle } from '@fortawesome/free-solid-svg-icons';
import { AssetQuoteType } from '../../model/source.model';
import { AssetService } from '../../service/asset.service';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';
import { AssetCodePipe } from '../../utils/asset-code.pipe';
import { AssetTypePipe } from '../../utils/asset-type.pipe';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TrendComponent } from '../../utils/trend/trend.component';

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
    AssetTypePipe,
    AssetCodePipe,
    JsonPipe
  ],
  templateUrl: './investment-assets-table.component.html',
  styleUrl: './investment-assets-table.component.scss'
})
export class InvestmentAssetsTableComponent implements OnInit {

  private assetService = inject(AssetService);

  private investimentService = inject(InvestmentService);

  private portfolioService = inject(PortfolioService);

  editable = input<boolean>(false);

  datasource = computed(() => {
    const assets = Object.values(this.investimentService.assertsSignal())
      .map(asset => ({
        ...asset,
        deletable: this.editable() && (this.portfolioService.portfoliosOfAsset(asset)?.length || 0) < 1
      }))
    return assets;
  });

  readonly iconTrue = faCircleCheck;

  readonly iconFalse = faXmarkCircle;

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'trend', 'lastUpdate', 'controlByQty', 'manualQuote'];

  ngOnInit() {
    if (this.editable()) {
      this.displayedColumns.push('actions');
    }
  }

  trackByFn: TrackByFunction<AssetQuoteType> = (index: number, item: AssetQuoteType) => {
    return item.ticker;
  };
  editAsset(asset: AssetQuoteType) {
    this.assetService.editDialog(asset);
  }

  newAsset() {
    this.assetService.newDialog();
  }

  deleteAsset(asset: AssetQuoteType) {
    this.assetService.deleteAsset(asset.ticker);
  }
  
}
