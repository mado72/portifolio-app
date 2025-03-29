import { computed, Signal, signal } from "@angular/core";
import { Currency, CurrencyAmount, CurrencyType } from "./domain.model";
import { AssetAllocation, AssetQuoteRecord, fnTrend, TrendType } from "./investment.model";
import { getMarketPlaceCode } from "../service/quote.service";

export type AllocationDataType = {
    marketPlace: string,
    code: string,
    quantity: number,
    percPlanned: number,
    initialValue: number
    averagePrice: number,
    marketValue: number,
}

export type AllocationDataTypeRecord = Record<string, AllocationDataType>;

export type AllocationQuotedDataType = AllocationDataType & {
    quote: CurrencyAmount,
    profit: number;
    percAllocation: number,
    performance: number,
    trend: TrendType,
}

export type AllocationQuotedDataTypeRecord = Record<string, AllocationQuotedDataType>;

export type PortfolioDataType = {
    id: string,
    name: string,
    currency: Currency,
    allocations: Record<string, AllocationDataType>,
}

export type PortfolioQuotedDataType = PortfolioDataType & {
    allocations: AllocationQuotedDataTypeRecord;
}

const INITIAL_TOTAL: AllocationQuotedDataType = {
    marketPlace: '',
    code: 'total',
    quantity: NaN,
    quote: { amount: NaN, currency: Currency.BRL },
    averagePrice: NaN,
    initialValue: 0,
    marketValue: 0,
    percPlanned: 0,
    percAllocation: 0,
    profit: 0,
    performance: 0,
    trend: 'unchanged'
};

export class Portfolio {
    id: string;
    name: string;
    currency: Currency;
    quotes: Signal<AssetQuoteRecord>;
    allocations = signal<AllocationDataTypeRecord>({});

    position = computed<AllocationQuotedDataTypeRecord>(() => {
        const quotes = this.quotes();
        const calc = this.calcPosition(quotes, this.allocations());
        return calc;
    })

    constructor(
        { id, name, currency, allocations: assets, exchanges, quotes }:
            {
                id: string;
                name: string;
                currency: Currency;
                allocations: AllocationDataType[],
                exchanges: Record<CurrencyType, Record<CurrencyType, number>>,
                quotes: Signal<AssetQuoteRecord>;
            }) {

        this.id = id;
        this.name = name;
        this.currency = currency;
        this.quotes = quotes;
        this.allocations.set(assets.reduce((acc, asset) => {
            const ticker = getMarketPlaceCode(asset);
            acc[ticker] = { ...asset };
            return acc;
        }, {} as AllocationDataTypeRecord));
    }

    calcPosition(quotes: AssetQuoteRecord, allocations: AllocationDataTypeRecord) {
        const calc = Object.entries(allocations).reduce((acc, [key, allocation]) => {
            const quoteAmount = quotes[key].quote.amount;
            const marketValue = quoteAmount * allocation.quantity;
            const averagePrice = Math.trunc(100 * allocation.initialValue / allocation.quantity) / 100;
            const trend = fnTrend(quotes[key]);
            acc[key] = this.createAllocation(allocation, averagePrice, quotes, key, marketValue, quoteAmount, trend);

            const total = acc['total'];

            total.marketValue += acc[key].marketValue;
            total.percPlanned += acc[key].percPlanned;
            total.percAllocation += acc[key].percAllocation;
            total.profit += acc[key].profit;
            total.performance = total.profit / total.marketValue;

            return acc;
        }, {
            total: { ...INITIAL_TOTAL }
        } as AllocationQuotedDataTypeRecord);

        Object.entries(calc).filter(([key, _]) => key !== 'total').forEach(([_, item]) => {
            item.percAllocation = item.marketValue / calc['total'].marketValue;
            calc['total'].percAllocation += item.percAllocation;
        });

        return calc;
    }


    private createAllocation(allocation: AllocationDataType, averagePrice: number, 
        quotes: AssetQuoteRecord, key: string, marketValue: number, 
        quoteAmount: number, trend: TrendType): AllocationQuotedDataType {

        return {
            ...allocation,
            averagePrice,
            quote: quotes[key].quote,
            initialValue: allocation.initialValue, // FIXME this should be return from the datasource
            marketValue: marketValue,
            percAllocation: 0,
            profit: allocation.quantity * (quoteAmount - averagePrice),
            performance: (marketValue - allocation.initialValue) / allocation.initialValue,
            trend
        };
    }
}

export type PortfolioAssetsSummary = {
    assets: {
        ticker: string,
        quantity: number
    }[];
    id: string;
    name: string;
    currency: Currency;
};