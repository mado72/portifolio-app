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
    quote: CurrencyAmount;
    lastUpdate: Date;
    controlByQty: boolean;
    marketPlace: string;
    initialQuote?: CurrencyAmount;
}

export type AssetAllocation = Asset & {
    quantity: number;
    marketValue: number;
    percPlanned: number;
    averageBuy?: number;
    performance?: number;
}

export type AssetPosition = AssetAllocation & {
    percAllocation: number;
}

export type AssetAllocationRecord = Record<string,AssetAllocation>;

export type AssetPositionRecord = Record<string,AssetPosition>;

export type Portfolio = {
    id: string;
    name: string;
    currency: Currency;
    assets: AssetPositionRecord;
}

export type TrendType = 'up' | 'down' | 'unchanged';

export type AssetQuote = {
    lastUpdate: Date;
    quote: CurrencyAmount;
    initialQuote: CurrencyAmount;
    trend?: TrendType;
};

export const fnTrend = (quote: AssetQuote): TrendType => {
    const up =  quote.quote.amount > quote.initialQuote.amount;
    const down = quote.quote.amount < quote.initialQuote.amount;
    return up? 'up' : down? 'down' : 'unchanged';
};

export type AssetQuoteRecord = Record<string,AssetQuote>;

export type QuoteExchangeInfo = {
  original: CurrencyAmount;
  value: CurrencyAmount;
  exchange: Exchange;
}