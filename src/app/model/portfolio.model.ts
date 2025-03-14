import { computed, Signal, signal } from "@angular/core";
import { Currency } from "./domain.model";
import { Asset, AssetAllocation, AssetQuote, AssetQuoteRecord } from "./investment.model";

export type AssetPosition = AssetAllocation & {
    averageBuy: number;
    quantity: number;
};

export type AssetPositionRecord = Record<string, AssetPosition>;

export type AssetValueRecord = Record<string, {
    marketValue: number;
    percPlanned: number;
    percAllocation: number;
    profit: number;
    performance: number;
}>

export class Portfolio {
    id: string;
    name: string;
    currency: Currency;
    quotes: Signal<AssetQuoteRecord>;
    assets = signal<AssetPositionRecord>({});

    position = computed<AssetValueRecord>(()=>{
        const quotes = this.quotes();
        const calc = Object.entries(this.assets()).reduce((acc, [key, asset]) => {
            const quote = quotes[key].quote.amount;
            acc[key] = {
                marketValue: quote * asset.quantity,
                percPlanned: asset.percPlanned,
                percAllocation: 0,
                profit: asset.quantity * (quote - asset.averageBuy),
                performance: (quote * asset.quantity - asset.averageBuy) / quote * asset.quantity
            };
            acc['total'].marketValue += acc[key].marketValue;
            acc['total'].percPlanned += acc[key].percPlanned;
            acc['total'].percAllocation += acc[key].percAllocation;
            acc['total'].profit += acc[key].profit;
            acc['total'].performance = acc['total'].profit / acc['total'].marketValue;
            return acc;
        }, {
            total: {
                marketValue: 0,
                percPlanned: 0,
                percAllocation: 0,
                profit: 0,
                performance: 0
            }
        } as AssetValueRecord)
        Object.entries(calc).filter(([key, item])=> key !== 'total').forEach(([_, item])=>{
            item.percAllocation = item.marketValue / calc['total'].marketValue;
            calc['total'].percAllocation += item.percAllocation;
        });
        return calc;
    })

    constructor(id: string, name: string, currency: Currency, quotes: Signal<AssetQuoteRecord>) {
        this.id = id;
        this.name = name;
        this.currency = currency;
        this.quotes = quotes;
    }

}
