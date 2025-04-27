import { TestBed } from '@angular/core/testing';
import { ExchangeService } from './exchange.service';
import { RemoteQuotesService } from './remote-quotes.service';
import { signal } from '@angular/core';
import { ExchangeView, Income } from '../model/investment.model';
import { Currency, CurrencyType } from '../model/domain.model';
import { AssetService } from './asset.service';
import { AssetQuoteType, PortfolioRecord } from '../model/source.model';
import { InvestmentService } from './investment.service';
import { PortfolioService } from './portfolio-service';

export const exchangeServiceMock: jasmine.SpyObj<ExchangeService> = jasmine.createSpyObj('ExchangeService', ['exchange', 'currencyToSymbol', 'getExchangeQuote', 'enhanceExchangeInfo'], {
    currencyDefault: signal<Currency>(Currency.BRL),
    exchangeView: signal<ExchangeView>("original"),
    exchanges: signal({} as Record<CurrencyType, Record<CurrencyType, number>>),
});

class RemoteQuotesServiceMock {
}

export const assetsMock$ = signal<Record<string, AssetQuoteType>>({});
export const investmentAssetsMock$ = signal<Record<number, Income>>({})
export const totalMock$ = signal<{
    initialValue: number;
    marketValue: number;
    percPlanned: number;
    percAllocation: number;
    profit: number;
    performance: number;
}>({} as any);
export const portfoliosMock$ = signal<PortfolioRecord>({});


export const provideExchangeServiceMock = () => {
    exchangeServiceMock.getExchangeQuote.and.returnValue(1);
    exchangeServiceMock.enhanceExchangeInfo.and.returnValue({ value: {} });
    exchangeServiceMock.exchange.and.callFake((value: number, from: Currency, to: Currency) => {
        return { currency: to, value: value * 1 };
    });
    exchangeServiceMock.currencyToSymbol.and.callFake((currency: string) => {
        return currency === 'BRL' ? 'R$' : currency;
    });

    return [{
        provide: ExchangeService,
        useFactory: (_: RemoteQuotesService) => exchangeServiceMock,
        deps: [RemoteQuotesService]
    },
    {
        provide: RemoteQuotesService,
        useClass: RemoteQuotesServiceMock
    }];
};

export const assetServiceMock: jasmine.SpyObj<AssetService> = jasmine.createSpyObj('AssetService',
    ['getAllocationSummary', 'getBalancesByCurrencyExchange', 'portfolioAllocation',
        'getBalancesSummarized', 'getForecastSummary', 'getAllBalances',
        'portfolios', 'summarizeByClass', 'newDialog'], {

    assets: assetsMock$
});

export const provideAssetServiceMock = () => {
    return [{
        provide: AssetService,
        useFactory: () => assetServiceMock,
        deps: []
    }];
}

export const investmentServiceMock: jasmine.SpyObj<InvestmentService> = jasmine.createSpyObj('InvestmentService', [
    'findIncomesBetween'
], {
    investmentAssets: investmentAssetsMock$
});

export const provideInvestmentServiceMock = () => {
    return [{
        provide: InvestmentService,
        useFactory: () => investmentServiceMock,
        deps: []
    }];
}

export const portfolioServiceMock: jasmine.SpyObj<PortfolioService> = jasmine.createSpyObj('PortfolioService', [
    'portfolioAllocation',
    'processAllocations',
    'getAllPortfolios',
], {
    total: totalMock$,
    portfolios: portfoliosMock$,
});

export const providePortfolioServiceMock = () => {
    return [{
        provide: PortfolioService,
        useFactory: () => portfolioServiceMock,
        deps: []
    }];
}