import { Component, inject } from '@angular/core';
import { InvestmentAssetsTableComponent } from "../../investment/investment-assets-table/investment-assets-table.component";
import { Asset, AssetFormModel } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { AssetDetailsComponent } from "../asset-details/asset-details.component";
import { getMarketPlaceCode } from '../../service/quote.service';

@Component({
  selector: 'app-asset-registration',
  standalone: true,
  imports: [InvestmentAssetsTableComponent, AssetDetailsComponent],
  templateUrl: './asset-registration.component.html',
  styleUrl: './asset-registration.component.scss'
})
export class AssetRegistrationComponent {
  private investimentService = inject(InvestmentService);

  datasource = this.investimentService.getAssetsDatasourceComputed();

  assetSelected : AssetFormModel | undefined = undefined;

  selectAsset(asset: Asset) {
    this.assetSelected = {...asset, currency: asset.quote.currency};
  }

  canceled() {
    this.assetSelected = undefined;
  }

  saved(inputData: AssetFormModel | undefined) {
    if (!!inputData) {
      const code = getMarketPlaceCode(this.assetSelected as AssetFormModel);
      const asset = this.investimentService.assertsSignal()[code];
  
      if (asset) {
        this.investimentService.updateAsset(code, inputData);
      }
      else {
        this.investimentService.addAsset(inputData);
      }
    }

    this.assetSelected = undefined;
  }

}
