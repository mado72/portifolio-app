import { DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, Signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faXmarkCircle } from '@fortawesome/free-solid-svg-icons';
import { Asset, TrendType } from '../../model/investment.model';
import { InvestmentService } from '../../service/investment.service';
import { AssetCodePipe } from '../../utils/asset-code.pipe';
import { AssetTypePipe } from '../../utils/asset-type.pipe';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TrendComponent } from '../../utils/trend/trend.component';

@Component({
  selector: 'app-investment-assets-table',
  standalone: true,
  imports: [
    MatTableModule,
    DatePipe,
    FontAwesomeModule,
    CurrencyComponent,
    TrendComponent,
    AssetTypePipe,
    AssetCodePipe
  ],
  templateUrl: './investment-assets-table.component.html',
  styleUrl: './investment-assets-table.component.scss'
})
export class InvestmentAssetsTableComponent {

  private investmentService = inject(InvestmentService);

  readonly iconTrue = faCircleCheck;
  readonly iconFalse = faXmarkCircle;

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'trend', 'lastUpdate', 'controlByQty', 'manualQuote'];

  @Input() enableSelection: boolean = false;

  @Output() onSelected = new EventEmitter<Asset>();

  @Input() datasource!: Signal<(Asset & {
    trend: TrendType;
  })[]>;

  rowClick(asset: Asset) {
    this.onSelected.emit(asset);
  }
  
}
