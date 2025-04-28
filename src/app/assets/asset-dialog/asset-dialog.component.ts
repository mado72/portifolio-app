import { AfterViewInit, Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { combineLatest, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { Currency, CurrencyValue } from '../../model/domain.model';
import { MarketPlaceEnum } from '../../model/investment.model';
import { AssetEnum, AssetQuoteType } from '../../model/source.model';
import { RemoteQuotesService } from '../../service/remote-quotes.service';
import { AssetTypePipe } from '../../utils/pipe/asset-type.pipe';
import { CurrencyPipe } from '@angular/common';

export type AssetDialogType = {
  title: string,
  newAsset: boolean,
  asset: AssetQuoteType | null
}

@Component({
  selector: 'app-asset-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatButtonModule,
    CurrencyPipe,
    AssetTypePipe
  ],
  templateUrl: './asset-dialog.component.html',
  styleUrl: './asset-dialog.component.scss'
})
export class AssetDialogComponent implements AfterViewInit {

  readonly data = inject<AssetDialogType>(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<AssetDialogComponent>);

  readonly remoteQuotesService = inject(RemoteQuotesService);
  
  readonly marketPlaces = Object.values(MarketPlaceEnum);
  
  readonly assetTypes = Object.values(AssetEnum);
  
  readonly currencies = Object.values(Currency);

  private fb = inject(FormBuilder);

  formAsset = this.fb.group({
    name: this.fb.control(this.data.asset?.name, [Validators.required]),
    marketPlace: this.fb.control(this.data.asset?.ticker.replace(/:.*$/,''), [Validators.required]),
    code: this.fb.control(this.data.asset?.ticker.replace(/^.*:/,''), [Validators.required]),
    type: this.fb.control(this.data.asset?.type, [Validators.required]),
    quote: this.fb.group({
      value: this.fb.control(this.data.asset?.quote.value, []),
      currency: this.fb.control(this.data.asset?.quote.currency, [Validators.required]),
    }),
    controlByQty: this.fb.control(this.data.asset?.controlByQty, []),
    manualQuote: this.fb.control(this.data.asset?.manualQuote, []),
  });

  constructor() {
    this.marketPlace.valueChanges.subscribe(v=>{
      if (v === MarketPlaceEnum.OTHER) {
        this.manualQuote.setValue(true, { emitEvent: false });
        this.manualQuote.disable();
      }
      else {
        this.manualQuote.enable();
      }
    })
    this.code.valueChanges.subscribe(v=>{
      this.code.setValue(v.toLocaleUpperCase(), { emitEvent: false });
    });
  }
  
  ngAfterViewInit(): void {
    combineLatest([
      this.marketPlace.valueChanges.pipe(startWith(this.marketPlace.value)),
      this.code.valueChanges.pipe(startWith(this.code.value)),
      this.manualQuote.valueChanges.pipe(startWith(this.manualQuote.value))
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
    ]).subscribe(([marketPlace, code]) => {
      const manualQuote = this.manualQuote.value;
      if (!! code && ! manualQuote) {
        this.remoteQuotesService.getRemoteQuote(marketPlace, code.toLocaleUpperCase()).subscribe(quoteResponse => {
          if (quoteResponse) {
            if (! this.name.value) {
              this.name.setValue(quoteResponse.name, {emitEvent: false});
              this.quoteValue.setValue(quoteResponse.price, {emitEvent: false});
              this.quoteCurrency.setValue(quoteResponse.currency, {emitEvent: false});
            }
            this.quoteCurrency.setValue(quoteResponse.currency, {emitEvent: false});
          }
        })
      }
    })
  }

  submitForm() {
    const data = {
      name: this.formAsset.value.name,
      marketPlace: this.formAsset.value.marketPlace,
      code: this.formAsset.value.code,
      type: this.formAsset.value.type as AssetEnum,
      quote: this.formAsset.value.quote as CurrencyValue,
      controlByQty: this.formAsset.value.controlByQty as boolean,
      manualQuote: this.formAsset.value.manualQuote as boolean
    };
    this.dialogRef.close(data)
  }

  get name() {
    return this.formAsset.get('name') as FormControl<string>;
  }

  get marketPlace() {
    return this.formAsset.get('marketPlace') as FormControl<MarketPlaceEnum>;
  }

  get code() {
    return this.formAsset.get("code") as FormControl<string>;
  }

  get type() {
    return this.formAsset.get("type") as FormControl<AssetEnum>;
  }

  get quoteCurrency() {
    return this.formAsset.get("quote.currency") as FormControl<Currency>;
  }

  get quoteValue() {
    return this.formAsset.get("quote.value") as FormControl<number>;
  }

  get controlByQty() {
    return this.formAsset.get('controlByQty') as FormControl<boolean>;
  }

  get manualQuote() {
    return this.formAsset.get('manualQuote') as FormControl<boolean>;
  }

}
