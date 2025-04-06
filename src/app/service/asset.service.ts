import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { AssetEnum, AssetQuoteType } from '../model/source.model';
import { AssetDialogComponent } from '../registration/asset-dialog/asset-dialog.component';
import { Currency } from '../model/domain.model';
import { InvestmentService } from './investment.service';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  private dialog = inject(MatDialog);

  private quoteService = inject(QuoteService);

  private investimentService = inject(InvestmentService);
  
  constructor() { }

  openDialog(title: string, asset: AssetQuoteType, newAsset: boolean = false) {
    return this.dialog.open(AssetDialogComponent, {
      data: {
        title,
        asset,
        newAsset
      }
    });
  }

  newDialog() {
    const dialogRef = this.openDialog('Novo ativo',  {
              name: '',
              code: '',
              ticker: '',
              initialPrice: 0,
              type: AssetEnum.STOCK,
              lastUpdate: new Date(),
              controlByQty: true,
              marketPlace: '',
              quote: {
                currency: Currency.BRL,
                price: 0
              },
              trend: "unchanged"
            },
          true);
    
    dialogRef.afterClosed().subscribe((result: AssetQuoteType) => {
      if (result) {
        this.saveAsset(result, true);
      }
    });
  }

  editDialog(asset: AssetQuoteType) {
    const ticker = getMarketPlaceCode(asset);
    const dialogRef = this.openDialog(`Editando Ativo ${ticker}`, asset, false);

    dialogRef.afterClosed().subscribe((result: AssetQuoteType) => {
      if (result) {
        this.saveAsset(result, false);
      }
    });
  }

  protected saveAsset(asset: AssetQuoteType, newAsset: boolean) {
    const ticker = getMarketPlaceCode(asset);
    asset = {
      ...this.quoteService.quotes()[ticker],
      ...asset
    };
    if (newAsset) {
      this.investimentService.addAsset(asset);
    } else {
      this.investimentService.updateAsset(ticker, asset);
    }
}

  deleteAsset(ticker: string) {
    const [marketPlace, code] = ticker.split(':')
    this.investimentService.deleteAsset({marketPlace, code});
  }

}
