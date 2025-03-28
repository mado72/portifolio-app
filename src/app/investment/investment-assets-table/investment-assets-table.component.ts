import { DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faXmarkCircle } from '@fortawesome/free-solid-svg-icons';
import { InvestmentService } from '../../service/investment.service';
import { AssetCodePipe } from '../../utils/asset-code.pipe';
import { AssetTypePipe } from '../../utils/asset-type.pipe';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { TrendComponent } from '../../utils/trend/trend.component';
import { AssetQuoteType } from '../../model/source.model';

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

  @Output() onSelected = new EventEmitter<AssetQuoteType>();

  @Input() datasource!: (AssetQuoteType)[];

  rowClick(asset: AssetQuoteType) {
    this.onSelected.emit(asset);
  }
  
}
