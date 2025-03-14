import { Currency, CurrencyAmount, Exchange } from "./domain.model";

export enum AssetEnum {
    STOCK = "STOCK",
    BOND = "BOND",
    ETF = "ETF",
    CRYPTO = "CRYPTO",
    REAL_ESTATE = "REAL_ESTATE",
    CURRENCY = "CURRENCY",
    OTHER = "OTHER"
}

export type Asset = {
    name: string;
    code: string;
    type: AssetEnum;
    lastUpdate: Date;
    controlByQty: boolean;
    marketPlace: string;
    quote: CurrencyAmount;
    initialQuote?: number;
    manualQuote?: boolean;
}

export type AssetFormModel = Pick<Asset, "name" | "code" | "type" | "marketPlace" | "controlByQty" | "manualQuote"> & {
    currency: Currency;
};

export type AssetAllocation = Asset & {
    quantity: number;
    percPlanned: number;
    averageBuy: number;
}

export type AssetAllocationRecord = Record<string,AssetAllocation>;

export type TrendType = 'up' | 'down' | 'unchanged';

export type AssetQuote = {
    lastUpdate: Date;
    quote: CurrencyAmount;
    initialQuote: number;
    trend?: TrendType;
};

export type AssetQuoteRecord = Record<string,AssetQuote>;

export const fnTrend = (quote: AssetQuote): TrendType => {
    const up =  quote.quote.amount > quote.initialQuote;
    const down = quote.quote.amount < quote.initialQuote;
    return up? 'up' : down? 'down' : 'unchanged';
};

export type QuoteExchangeInfo = {
  original: CurrencyAmount;
  value: CurrencyAmount;
  exchange: Exchange;
}

export enum MarketPlaceEnum {
    BVMF = 'BVMF',
    NASDAQ = 'NASDAQ',
    NYSE = 'NYSE',
    // BSE = 'BSE',
    IEX = 'IEX',
    FOREX = 'FOREX',
    // CFD = 'CFD',
    COIN = 'COIN'
}

export type MarketPlaceType = `${MarketPlaceEnum}`;

export function marketPlaceOf(marketPlace: string) {
    return MarketPlaceEnum[marketPlace as keyof typeof MarketPlaceEnum];
}