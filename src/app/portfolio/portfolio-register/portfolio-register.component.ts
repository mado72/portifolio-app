import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ExchangeService } from '../../service/exchange.service';
import { PortfolioService } from '../../service/portfolio-service';
import { TransactionService } from '../../service/transaction.service';
import { DatasourceMasterType, PortfolioRegisterTableComponent } from '../portfolio-register-table/portfolio-register-table.component';

@Component({
  selector: 'app-portfolio-register',
  standalone: true,
  imports: [
    MatButtonModule,
    PortfolioRegisterTableComponent
],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0', maxHeight: '0', opacity: '0' })),
      state('expanded', style({ height: '*', maxHeight: '', opacity: '1' })),
      transition('expanded <=> collapsed', animate('1s cubic-bezier(.28,.5,.83,.67)')),
      transition('collapsed <=> expanded', animate('1s cubic-bezier(.17,.67,.83,.67)')),
    ]),
  ],
  templateUrl: './portfolio-register.component.html',
  styleUrl: './portfolio-register.component.scss'
})
export class PortfolioRegisterComponent {

  private portfolioService = inject(PortfolioService);

  private exchangeService = inject(ExchangeService);

  private transactionService = inject(TransactionService);

  currency = computed(() => this.exchangeService.currencyDefault());

  total = computed(() => this.exchangeService.enhanceExchangeInfo(
    this.portfolioService.total(), this.exchangeService.currencyDefault(), ["initialValue", "marketValue", "profit"]));

  exchangeView = computed(() => this.exchangeService.exchangeView())

  portfolios = computed(() => this.portfolioService.portfolioAllocation()
    .map(portfolio => ({
      ...portfolio,
      total: {
        ...portfolio.total,
        ...this.exchangeService.enhanceExchangeInfo(portfolio.total, portfolio.currency, ["initialValue", "marketValue", "profit"])
      }
    } as DatasourceMasterType)));

  expandedElement: DatasourceMasterType | null = null;

  editable = input<boolean>(false);

  constructor() {}

  addPortfolio() {
    this.portfolioService.openPortfolioDialog({
      title: 'Adicionar carteira',
      portfolioInfo: {
        name: '',
        currency: this.exchangeService.currencyDefault(),
        classify: '',
        percPlanned: 0,
      }
    });
  }

  editPortfolio(portfolio: DatasourceMasterType) {
    this.portfolioService.openPortfolioDialog({
      title: 'Editar carteira',
      portfolioInfo: portfolio.id
    });
  }

  deletePortfolio(portfolio: DatasourceMasterType) {
    this.portfolioService.removePortfolio(portfolio.id);
  }
  
  addTransaction() {
    this.transactionService.createTransaction();
  }

  updatePortfolio(portfolio: DatasourceMasterType) {
    this.portfolioService.updatePortfolio(portfolio.id, { ...portfolio });
  }
}
