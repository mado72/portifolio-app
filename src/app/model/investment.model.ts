import { Currency, CurrencyAmount } from "./domain.model";

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
}

export type AssetAllocation = Asset & {
    quantity: number;
    marketValue: number;
    percPlanned: number;
    initialValue?: number;
    performance?: number;
}

export type AssetPosition = AssetAllocation & {
    percAllocation: number;
}

export type Portfolio = {
    id: string;
    name: string;
    currency: Currency;
    assets: AssetAllocation[];
}
