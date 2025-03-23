import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Currency, CurrencyAmount } from '../../model/domain.model';
import { Asset, AssetEnum, MarketPlaceEnum } from '../../model/investment.model';
import { AssetTypePipe } from '../../utils/asset-type.pipe';

export type AssetDialogType = {
  title: string,
  newAsset: boolean,
  asset: Asset | null
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
    AssetTypePipe
  ],
  templateUrl: './asset-dialog.component.html',
  styleUrl: './asset-dialog.component.scss'
})
export class AssetDialogComponent {

  // asset = model<Asset>();
  readonly data = inject<AssetDialogType>(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<AssetDialogComponent>);
  
  readonly marketPlaces = Object.values(MarketPlaceEnum);
  
  readonly assetTypes = Object.values(AssetEnum);
  
  readonly currencies = Object.values(Currency);

  private fb = inject(FormBuilder);

  formAsset = this.fb.group({
    name: [this.data.asset?.name, [Validators.required]],
    marketPlace: [this.data.asset?.marketPlace, [Validators.required]],
    code: [this.data.asset?.code, [Validators.required]],
    type: [this.data.asset?.type, [Validators.required]],
    quote: this.fb.group({
      amount: [this.data.asset?.quote.amount, []],
      currency: [this.data.asset?.quote.currency, [Validators.required]],
    }),
    controlByQty: [this.data.asset?.controlByQty, []],
    manualQuote: [this.data.asset?.manualQuote, []]
  });

  submitForm() {
    const data = {
      name: this.formAsset.value.name,
      marketPlace: this.formAsset.value.marketPlace,
      code: this.formAsset.value.code,
      type: this.formAsset.value.type as AssetEnum,
      quote: this.formAsset.value.quote as CurrencyAmount,
      controlByQty: this.formAsset.value.controlByQty as boolean,
      manualQuote: this.formAsset.value.manualQuote as boolean
    };
    this.dialogRef.close(data)
  }

}
