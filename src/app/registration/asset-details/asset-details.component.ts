import { JsonPipe } from '@angular/common';
import { Component, EventEmitter, inject, model, OnInit, Output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Currency, CurrencyAmount } from '../../model/domain.model';
import { Asset, AssetEnum, MarketPlaceEnum } from '../../model/investment.model';
import { AssetTypePipe } from '../../utils/asset-type.pipe';

@Component({
  selector: 'app-asset-details',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatButtonModule,
    JsonPipe,
    AssetTypePipe
],
  templateUrl: './asset-details.component.html',
  styleUrl: './asset-details.component.scss'
})
export class AssetDetailsComponent implements OnInit {

  asset = model<Asset>();

  private fb = inject(FormBuilder);

  @Output() canceled = new EventEmitter<void>();

  readonly marketPlaces = Object.values(MarketPlaceEnum);

  readonly assetTypes = Object.values(AssetEnum);

  readonly currencies = Object.values(Currency);

  formAsset = this.fb.group({
    name: [this.asset()?.name, [Validators.required]],
    marketPlace: [this.asset()?.marketPlace, [Validators.required]],
    code: [this.asset()?.code, [Validators.required]],
    type: [this.asset()?.type, [Validators.required]],
    quote: this.fb.group({
      amount: [this.asset()?.quote.amount, []],
      currency: [this.asset()?.quote.currency, [Validators.required]],
    }),
    controlByQty: [this.asset()?.controlByQty, []],
    manualQuote: [this.asset()?.manualQuote, []]
  });

  ngOnInit(): void {
    const asset = this.asset();
    asset && this.formAsset.patchValue(asset);
  }

  clickSave() {
    const data: Asset = {
      lastUpdate: new Date(),
      name: this.formAsset.value.name as string,
      marketPlace: this.formAsset.value.marketPlace as string,
      code: this.formAsset.value.code as string,
      type: this.formAsset.value.type as AssetEnum,
      quote: this.formAsset.value.quote as CurrencyAmount,
      controlByQty: this.formAsset.value.controlByQty as boolean,
      manualQuote: this.formAsset.value.manualQuote as boolean
    };

    this.asset.update(_ => data);
  }


  clickCancel() {
    this.canceled.emit();
  }

}
