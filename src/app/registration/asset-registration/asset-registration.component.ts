import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { InvestmentAssetsTableComponent } from "../../investment/investment-assets-table/investment-assets-table.component";
import { AssetEnum, AssetQuoteType } from '../../model/source.model';
import { InvestmentService } from '../../service/investment.service';
import { getMarketPlaceCode, QuoteService } from '../../service/quote.service';
import { AssetDialogComponent } from '../asset-dialog/asset-dialog.component';

@Component({
  selector: 'app-asset-registration',
  standalone: true,
  imports: [
    InvestmentAssetsTableComponent,
    MatButtonModule
  ],
  templateUrl: './asset-registration.component.html',
  styleUrl: './asset-registration.component.scss'
})
export class AssetRegistrationComponent {
  private investimentService = inject(InvestmentService);

  private quoteService = inject(QuoteService);

  datasource = this.investimentService.getAssetsDatasourceComputed();

  private dialog = inject(MatDialog);

  constructor() { }

  selectAsset(asset: AssetQuoteType) {
    const ticker = getMarketPlaceCode(asset);
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      data: {
        title: `Editando Ativo ${ticker}`,
        asset,
        newAsset: false
      }
    });

    dialogRef.afterClosed().subscribe((result: AssetQuoteType) => {
      if (result) {
        this.saveAsset(result);
      }
    });
  }

  saveAsset(inputData: AssetQuoteType) {
    const code = getMarketPlaceCode(inputData as AssetQuoteType);
    const asset = this.investimentService.assertsSignal()[code];

    if (asset) {
      this.investimentService.updateAsset(code, inputData);
    }
    else {
      this.investimentService.addAsset(inputData);
    }
  }

  newAsset() {
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      data: {
        title: 'Novo Ativo',
        asset: {
          name: '',
          code: '',
          type: AssetEnum.STOCK,
          lastUpdate: new Date(),
          controlByQty: true,
          marketPlace: '',
          quote: {
            currency: 'BRL',
            amount: 0
          },
          trend: "unchanged"
        },
        newAsset: true
      }
    });

    dialogRef.afterClosed().subscribe((result: AssetQuoteType) => {
      if (result) {
        this.saveAsset(result);
        this.quoteService.updateQuoteAsset(result);
      }
    });
  }

}
