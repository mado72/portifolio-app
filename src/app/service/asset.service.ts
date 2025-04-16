import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { AssetEnum, AssetQuoteType, TrendType } from '../model/source.model';
import { AssetDialogComponent } from '../assets/asset-dialog/asset-dialog.component';
import { Currency } from '../model/domain.model';
import { InvestmentService } from './investment.service';
import { SourceService } from './source.service';
import { concatMap, lastValueFrom, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  private dialog = inject(MatDialog);

  private sourceService = inject(SourceService);

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

  newDialog(ticker?: string) {
    return this.getInitialData(ticker)?.pipe(
      concatMap(data => {
        const dialogRef = this.openDialog('Novo ativo', data, true);

        return dialogRef.afterClosed().pipe(
          tap((result: AssetQuoteType) => {
            if (result) {
              this.saveAsset(result, true);
            }
          }))
      })
    )
  }

  protected getInitialData(ticker?: string) {
    const [marketPlace, code] = ticker && ticker.includes(':') ? ticker.split(':') : [ticker, ''];

    const data = {
      name: '',
      marketPlace: marketPlace || '',
      code: code || '',
      ticker: ticker || '',
      initialPrice: 0,
      type: AssetEnum.STOCK,
      lastUpdate: new Date(),
      controlByQty: true,
      quote: {
        currency: this.sourceService.currencyDefault(),
        value: 0
      },
      trend: "unchanged" as TrendType
    };

    if (!!ticker) {
      const asset = this.sourceService.assertSource()[ticker];
      if (!asset) {
        return this.quoteService.getRemoteAssetInfo(ticker).pipe(
          map((info) => {
            if (!!info) {
              data.name = info.name;
              data.quote = {
                currency: info.currency,
                value: info.price
              }
            }
            return data;
          }))
      }
    }
    return of(data);
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
    this.investimentService.deleteAsset({ marketPlace, code });
  }

}
