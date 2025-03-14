import { Component, inject } from '@angular/core';
import { InvestmentAssetsTableComponent } from "../investment-assets-table/investment-assets-table.component";
import { InvestmentService } from '../../service/investment.service';

@Component({
  selector: 'app-investment-assets-portlet',
  standalone: true,
  imports: [InvestmentAssetsTableComponent],
  templateUrl: './investment-assets-portlet.component.html',
  styleUrl: './investment-assets-portlet.component.scss'
})
export class InvestmentAssetsPortletComponent {

  private investmentService = inject(InvestmentService);
  
  datasource = this.investmentService.getAssetsDatasourceComputed();

}
