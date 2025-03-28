import { computed, Signal, signal } from "@angular/core";
import { Currency, CurrencyAmount, CurrencyType } from "./domain.model";
import { AssetAllocation, AssetQuoteRecord } from "./investment.model";
import { getMarketPlaceCode } from "../service/quote.service";

// export type AssetPositionRecord = Record<string, AssetAllocation>;

export type AssetValueRecord = Record<string, AllocationQuotedDataType>;

export type AllocationDataType = {
    marketPlace: string,
    code: string,
    quantity: number,
    percPlanned: number,
    initialValue: number
    averageBuy: number,
    marketValue: number,
}

export type AllocationDataTypeRecord = Record<string, AllocationDataType>;

export type AllocationQuotedDataType = AllocationDataType & {
    quote: CurrencyAmount,
    profit: number;
    percAllocation: number,
    performance: number
}

export type AllocationQuotedDataTypeRecord = Record<string, AllocationQuotedDataType>;

export type PortfolioDataType = {
    id: string,
    name: string,
    currency: Currency,
    allocations: Record<string, AllocationDataType>,
}

export type PortfolioQuotedDataType = PortfolioDataType & {
    allocations: AssetValueRecord;
}

export class Portfolio {
    id: string;
    name: string;
    currency: Currency;
    quotes: Signal<AssetQuoteRecord>;
    assets = signal<AllocationDataTypeRecord>({});

    position = computed<AssetValueRecord>(() => {
        const quotes = this.quotes();
        const calc = Object.entries(this.assets()).reduce((acc, [key, asset]) => {
            const quoteAmount = quotes[key].quote.amount;
            const marketValue = quoteAmount * asset.quantity;
            const averageBuy = marketValue / quoteAmount;
            acc[key] = {
                ...asset,
                averageBuy,
                quote: quotes[key].quote,
                initialValue: marketValue, // FIXME this should be return from the datasource
                marketValue: marketValue,
                percAllocation: 0,
                profit: asset.quantity * (quoteAmount - averageBuy),
                performance: (marketValue - averageBuy) / quoteAmount * asset.quantity
            };
            acc['total'].marketValue += acc[key].marketValue;
            acc['total'].percPlanned += acc[key].percPlanned;
            acc['total'].percAllocation += acc[key].percAllocation;
            acc['total'].profit += acc[key].profit;
            acc['total'].performance = acc['total'].profit / acc['total'].marketValue;
            return acc;
        }, {
            total: {
                marketPlace: '',
                code: 'total',
                quantity: NaN,
                quote: { amount: NaN, currency: Currency.BRL },
                averageBuy: NaN,
                initialValue: 0,
                marketValue: 0,
                percPlanned: 0,
                percAllocation: 0,
                profit: 0,
                performance: 0
            }
        } as AssetValueRecord)
        Object.entries(calc).filter(([key, _]) => key !== 'total').forEach(([_, item]) => {
            item.percAllocation = item.marketValue / calc['total'].marketValue;
            calc['total'].percAllocation += item.percAllocation;
        });
        return calc;
    })

    constructor(
            { id, name, currency, assets, exchanges, quotes }: 
            { id: string; 
                name: string; 
                currency: Currency; 
                assets: AllocationDataType[],
                exchanges: Record<CurrencyType, Record<CurrencyType, number>>,
                quotes: Signal<AssetQuoteRecord>; }) {

        this.id = id;
        this.name = name;
        this.currency = currency;
        this.quotes = quotes;
        this.assets.set(assets.reduce((acc, asset) => {
            const ticker = getMarketPlaceCode(asset);
            acc[ticker] = asset;
            return acc;
        }, {} as AllocationDataTypeRecord));
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