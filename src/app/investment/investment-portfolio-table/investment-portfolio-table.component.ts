import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { AssetValueRecord, Portfolio } from '../../model/portfolio.model';
import { InvestmentService } from '../../service/investment.service';
import { getMarketPlaceCode } from '../../service/quote.service';
import { AssetCodePipe } from '../../utils/asset-code.pipe';
import { AssetTypePipe } from '../../utils/asset-type.pipe';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { AssetAllocation } from '../../model/investment.model';

@Component({
  selector: 'app-investment-portfolio-table',
  standalone: true,
  imports: [
    MatTableModule,
    DecimalPipe,
    PercentPipe,
    CurrencyComponent,
    AssetTypePipe,
    AssetCodePipe
  ],
  templateUrl: './investment-portfolio-table.component.html',
  styleUrl: './investment-portfolio-table.component.scss'
})
export class InvestmentPortfolioTableComponent implements OnInit{

  private investmentService = inject(InvestmentService);

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'quantity', 'marketValue', 'profit', 'percPlanned', 'percAllocation'];

  @Input() editMode = false;

  @Input() portfolioId = '';

  @Output() rowSelected = new EventEmitter<AssetAllocation & AssetValueRecord>();

  portfolio = signal<Portfolio | undefined>(undefined);

  positions = computed(() =>this.portfolio()?.position() || {} as AssetValueRecord)

  datasource = computed(() => Object.values(this.portfolio()?.assets() || {})
    .map(asset=>{
      return {
        ...asset,
        position: this.positions()[getMarketPlaceCode(asset)]
      }
    }));


  get portfolioCurrency() {
    return this.portfolio()?.currency || Currency.BRL;
  }

  ngOnInit(): void {
    this.investmentService.getPortfolio(this.portfolioId).subscribe(porfolio => {
      this.portfolio.set(porfolio);
      // console.log(porfolio)
    });
  }

  total = computed(() => {
    if (this.portfolio()) {
      return {
       ...this.portfolio()?.assets()['total'],
        position: this.positions()['total']
      }
    }
    return undefined;
  })

  selectRow(row: AssetAllocation & AssetValueRecord) {
    this.rowSelected.emit(row);
  }
    
}
