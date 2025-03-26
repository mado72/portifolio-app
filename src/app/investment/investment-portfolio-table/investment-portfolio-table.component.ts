import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Currency } from '../../model/domain.model';
import { AssetAllocation } from '../../model/investment.model';
import { AssetValueRecord, Portfolio } from '../../model/portfolio.model';
import { InvestmentService } from '../../service/investment.service';
import { getMarketPlaceCode } from '../../service/quote.service';
import { AssetCodePipe } from '../../utils/asset-code.pipe';
import { AssetTypePipe } from '../../utils/asset-type.pipe';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { PorfolioAllocationDataType, PortfolioAllocationDialogComponent } from '../portfolio-allocation-dialog/portfolio-allocation-dialog.component';

type DatasourceType = ReturnType<InvestmentPortfolioTableComponent["buildDatasource"]>;

@Component({
  selector: 'app-investment-portfolio-table',
  standalone: true,
  imports: [
    MatTableModule,
    DecimalPipe,
    PercentPipe,
    CurrencyComponent,
    AssetTypePipe,
    AssetCodePipe,
    JsonPipe
  ],
  templateUrl: './investment-portfolio-table.component.html',
  styleUrl: './investment-portfolio-table.component.scss'
})
export class InvestmentPortfolioTableComponent implements OnInit {

  private investmentService = inject(InvestmentService);

  private dialog = inject(MatDialog);

  readonly displayedColumns: string[] = ['name', 'code', 'type', 'quote', 'quantity', 'marketValue', 'profit', 'percPlanned', 'percAllocation'];

  @Input() editMode = false;

  @Input() portfolioId = '';

  @Input() currency = Currency.BRL;

  datasource = signal<DatasourceType>([]);

  private portfolioName = '';

  buildDatasource(portfolio: Portfolio | undefined) {
    if (!portfolio || !portfolio.assets())
      return [];

    const assets = portfolio.assets();
    const positions = portfolio.position();

    const result = Object.values(assets).map(asset => ({
      ...asset,
      position: positions[getMarketPlaceCode(asset)]
    }));

    console.log(`Datasource built successfully`, result)

    return result;
  }


  ngOnInit(): void {
    this.investmentService.getPortfolio(this.portfolioId).subscribe(portfolio => {
      const ds = this.buildDatasource(portfolio);
      this.portfolioName = portfolio?.name || '';
      this.datasource.set(ds);
    });
  }

  total = computed(() => {
    if (this.datasource()) {
      return this.datasource().find(item => item.name === 'total');
    }
    return undefined;
  })

  selectRow(row: AssetAllocation & AssetValueRecord) {
    const ticket = new AssetCodePipe().transform(row);
    const data: PorfolioAllocationDataType = {
      asset: row,
      portfolio: this.portfolioName,
      quantity: row.quantity,
      percent: row.percPlanned
    }
    const dialogRef = this.dialog.open(PortfolioAllocationDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.investmentService.updatePortfolioAllocation(this.portfolioId, { ticket, ...result }).pipe(

        )

        this.investmentService.getPortfolio(this.portfolioId).subscribe(portfolio => {
          const ref = { ...portfolio };

          if (!ref) return;
          if (!ref.assets) return;

          const assets = ref.assets();
          
          
          this.investmentService.updatePortfolioAllocation(this.portfolioId, { ticket, ...result }).subscribe(portfolios => {

            // const allocation = { ...assets[ticket] };
            // allocation.quantity = result.quantity;
            // allocation.percPlanned = result.percent;
            // assets[ticket] = allocation;
  
            // const portfolio = new Portfolio(ref as Portfolio);
            // portfolio.assets.set(assets);
            // portfolio.name += '*';

            // this.portfolioName = portfolio.name;

            const ds = this.buildDatasource(portfolios.find(item => item.id === ref.id));
            this.datasource.set(ds);
          });
        });

      }

    });
  }

}
