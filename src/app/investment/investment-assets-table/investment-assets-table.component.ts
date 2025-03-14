import { DatePipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { InvestmentService } from '../../service/investment.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmarkCircle, faCircleCheck, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Asset } from '../../model/investment.model';
import { TrendComponent } from '../../utils/trend/trend.component';
import { AssetTypePipe } from '../../util/asset-type.pipe';
import { AssetCodePipe } from '../../util/asset-code.pipe';

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

  asserts = this.investmentService.assertsSignal;

  datasource = computed(()=> {
    const asserts = Object.values(this.asserts());
    return asserts;
  })

  rowClick(asset: Asset) {
    this.onSelected.emit(asset);
  }
  
}
