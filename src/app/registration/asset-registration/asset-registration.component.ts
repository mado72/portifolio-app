import { Component, effect, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InvestmentAssetsTableComponent } from "../../investment/investment-assets-table/investment-assets-table.component";
import { Asset } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { getMarketPlaceCode } from '../../service/quote.service';
import { AssetDialogComponent } from '../asset-dialog/asset-dialog.component';

@Component({
  selector: 'app-asset-registration',
  standalone: true,
  imports: [InvestmentAssetsTableComponent],
  templateUrl: './asset-registration.component.html',
  styleUrl: './asset-registration.component.scss'
})
export class AssetRegistrationComponent {
  private investimentService = inject(InvestmentService);

  datasource = this.investimentService.getAssetsDatasourceComputed();

  private dialog = inject(MatDialog);

  constructor() {
    effect(()=>{
      console.log(`Datasource changed:`, this.datasource());
    })
  }

  selectAsset(asset: Asset) {
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      data: {
        title: `Editando Ativo`,
        asset,
        newAsset: false
      }
    });

    dialogRef.afterClosed().subscribe((result: Asset) => {
      if (result) {
        this.saveAsset(result);
      }
    });
  }

  saveAsset(inputData: Asset) {
    const code = getMarketPlaceCode(inputData as Asset);
    const asset = this.investimentService.assertsSignal()[code];

    if (asset) {
      this.investimentService.updateAsset(code, inputData);
    }
    else {
      this.investimentService.addAsset(inputData);
    }
  }

}
