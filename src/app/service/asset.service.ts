import { computed, inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { concatMap, map, of, Subject, tap } from 'rxjs';
import { AssetDialogComponent } from '../assets/asset-dialog/asset-dialog.component';
import { AssetEnum, AssetQuoteType, Ticker, TrendType } from '../model/source.model';
import { ExchangeService } from './exchange.service';
import { getMarketPlaceCode, QuoteService } from './quote.service';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  private dialog = inject(MatDialog);

  private sourceService = inject(SourceService);

  private quoteService = inject(QuoteService);

  private exchangeService = inject(ExchangeService);

  deletedAsset$ = new Subject<Ticker>();

  assets = computed(() => {
    if (!this.sourceService.dataIsLoaded()) return {};

    return this.sourceService.assetSource();
  })

  dataIsLoaded = toObservable(this.sourceService.dataIsLoaded).subscribe((isLoaded)=>{
    if (isLoaded) {
      this.quoteService.addAssetsToUpdate(this.assets());
      this.quoteService.forceUpdate().subscribe(assets=>{
        const changes = Object.values(assets);
        if (changes.length) {
          this.sourceService.updateAsset(changes);
        }
      });
    }
  })

  constructor() { 
    this.quoteService.updateQuotes$.subscribe(assets=>{
      if (Object.keys(assets).length === 0) return;
      this.sourceService.updateAsset(Object.values(assets))
    })
  }
  
  // Force to update all assets
  updateAllAssets() {
    const assetsMap = Object.entries(this.assets())
      .filter(([_, asset]) => !asset.manualQuote)
      .reduce((acc, [ticker, asset]) => {
        acc[ticker] = asset;
        return acc;
      }, {} as Record<Ticker, AssetQuoteType>);
    this.quoteService.addAssetsToUpdate(assetsMap);
  }

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
          tap((result) => {
            if (result) {
              result = {...result, ticker: `${getMarketPlaceCode(result)}`};
              result.lastUpdate = new Date();
              delete result.marketPlace;
              delete result.code;
              this.addAsset(result);
            }
          }))
      })
    )
  }

  editDialog(asset: AssetQuoteType) {
    const ticker = asset.ticker
    const dialogRef = this.openDialog(`Editando Ativo ${ticker}`, asset, false);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        result.lastUpdate = new Date();
        result = {...result, ticker: `${getMarketPlaceCode(result)}`};
        delete result.marketPlace;
        delete result.code;
        this.updateAsset(result);
      }
    });
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
        currency: this.exchangeService.currencyDefault(),
        value: 0
      },
      trend: "unchanged" as TrendType
    };

    if (!!ticker) {
      const asset = this.sourceService.assetSource()[ticker];
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

  addAsset(asset: AssetQuoteType) {
    this.sourceService.addAsset(asset);
    this.requestUpdateQuote(asset);
  }

  updateAsset(asset: AssetQuoteType) {
    this.sourceService.updateAsset([asset]);
    this.requestUpdateQuote(asset);
  }
  
  deleteAsset(ticker: Ticker) {
    this.deletedAsset$.next(ticker);
    this.sourceService.deleteAsset(ticker);
  }
  
  requestUpdateQuote(asset: AssetQuoteType) {
    this.quoteService.addAssetToUpdate(asset);
  }

}
