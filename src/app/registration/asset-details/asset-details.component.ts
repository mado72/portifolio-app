import { JsonPipe } from '@angular/common';
import { Component, EventEmitter, Input, model, OnInit, Output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AssetEnum, AssetFormModel, MarketPlaceType } from '../../model/investment.model';
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

  asset = model<AssetFormModel>();

  @Output() canceled = new EventEmitter<void>();

  readonly marketPlaces: MarketPlaceType[] = ['BVMF', 'NYSE', 'NASDAQ', 'COIN', 'FOREX', 'IEX'];

  readonly assetTypes: AssetEnum[] = [AssetEnum.STOCK,AssetEnum.BOND,AssetEnum.REAL_ESTATE,AssetEnum.CRYPTO,AssetEnum.CURRENCY,AssetEnum.OTHER];

  formAsset = new FormBuilder().group({
    name: [''],
    marketPlace: [''],
    code: [''],
    type: [''],
    controlByQty: [true],
    manualQuote: [false]
  });

  ngOnInit(): void {
    this.asset() && this.formAsset.patchValue(this.asset() as Required<AssetFormModel>);
  }

  clickSave() {
    this.asset.update(_ => this.formAsset.value as AssetFormModel);
  }

  clickCancel() {
    this.canceled.emit();
  }

}
