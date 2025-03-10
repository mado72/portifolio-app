import { Currency } from "./domain.model";

export enum AssetEnum {
    Stocks,
    Bonds,
    Cryptocurrencies,
    RealEstate,
    Other
}

export type Asset = {
    name: string;
    code: string;
    type: AssetEnum;
    price: number;
    currency: Currency;
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
    assets: AssetAllocation[];
}
