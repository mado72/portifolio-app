import { AccountTypeEnum, Currency, CurrencyAmount, CurrencyPrice, Scheduled, TransactionEnum } from "./domain.model";
import { InvestmentEnum, TransactionStatus, } from "./investment.model";

export type EntityDataSource = {
    id: string;
}

export type DataSourceType = {
    asset: AssetSourceDataType[],
    balance: BalanceSourceDataType[],
    classConsolidation: ClassConsolidationSourceDataType[],
    earning: IncomeSourceDataType[],
    investment: InvestmentTransactionSourceDataType[],
    portfolio: PortfolioSourceDataType[],
    cashflow: TransactionSourceDataType[],
    scheduleds: ScheduledsSourceDataType[],
}

export type AssetSourceDataType = {
    code: string;
    marketPlace: string;
    controlByQty: boolean;
    quote: {
        price: number;
        currency: string;
    };
    lastUpdate: string;
    type: string;
    name: string;
    manualQuote?: boolean;
};

export type TrendType = 'up' | 'down' | 'unchanged';

export const fnTrend = (quotation: { initialPrice: number, quote: CurrencyPrice }): TrendType => {
    if (!quotation.quote.price) return 'unchanged';
    const up = quotation.quote.price > quotation.initialPrice;
    const down = quotation.quote.price < quotation.initialPrice;
    return up ? 'up' : down ? 'down' : 'unchanged';
};


export enum AssetEnum {
    STOCK = "STOCK",
    BOND = "BOND",
    ETF = "ETF",
    CRYPTO = "CRYPTO",
    REAL_ESTATE = "REAL_ESTATE",
    CURRENCY = "CURRENCY",
    OTHER = "OTHER"
}

export const AssetDesc: Record<`${AssetEnum}`, string> = {
    STOCK: 'Ação',
    BOND: 'Fundo',
    ETF: 'ETF',
    CRYPTO: 'Crypto',
    REAL_ESTATE: 'FI',
    CURRENCY: 'Moeda',
    OTHER: 'Outro'
}

export type AssetQuoteType = Omit<AssetSourceDataType, "quote" | "type" | "lastUpdate"> & {
    ticker: string;
    initialPrice: number;
    lastUpdate: Date;
    quote: CurrencyPrice;
    type: AssetEnum;
    trend: TrendType
}

export type AssetQuoteRecord = Record<string, AssetQuoteType>;

export type BalanceSourceDataType = {
    id?: string;
    accountName: string;
    balance: number;
    currency: string;
    type: string;
    date: string;
};

export type BalanceType = Omit<BalanceSourceDataType, "balance" | "currency" | "type" | "date"> & {
    balance: CurrencyPrice;
    type: AccountTypeEnum;
    date: Date;
}

export type BalanceRecord = Record<string, BalanceType>;

export type ClassConsolidationSourceDataType = {
    class: string;
    financial: number;
    currency: string;
    percentagePlanned: number;
}

export type ClassConsolidationType = Omit<ClassConsolidationSourceDataType, "financial" | "currency"> & {
    financial: CurrencyPrice;
}

export type ClassConsolidationRecord = Record<string, ClassConsolidationType>;

export type IncomeSourceDataType = {
    id: string;
    ticker: string;
    date: string;
    type: string;
    amount: number;
}

export type IncomeType = Omit<IncomeSourceDataType, "date"> & {
    date: Date;
}

export type IncomeRecord = Record<string, IncomeType>;

export type InvestmentTransactionSourceDataType = {
    id: string;
    ticker: string;
    date: string;
    accountId: string;
    quantity: number;
    quote: number;
    value: {
        currency: string;
        price: number;
    };
    type: string;
    status: string;
    brokerage?: number;
}

export type InvestmentTransactionType = Omit<InvestmentTransactionSourceDataType, "date" | "value" | "type" | "status"> & {
    date: Date;
    value: CurrencyPrice;
    type: InvestmentEnum;
    status: TransactionStatus;
}

export type InvestmentTransactionRecord = Record<string, InvestmentTransactionType>;

export type TransactionSourceDataType = {
    id?: string;
    type: string;
    description: string;
    date: string;
    currency: string;
    amount: number;
    account_id: string;
    status: string;
    scheduled_ref?: string;
}

export type TransactionType = Omit<TransactionSourceDataType, "date" | "type" | "amount" | "currency" | "account_id" | "scheduled_ref" | "status"> & {
    date: Date;
    type: TransactionEnum;
    value: CurrencyAmount;
    originAccountId: string;
    status: TransactionStatus;
    scheduledRef?: string;
}

export type TransactionRecord = Record<string, TransactionType>;

export type SummarizedDataType = {
    initialValue: number,
    marketValue: number,
    percPlanned: number,
    percAllocation?: number,
    profit?: number,
    performance?: number
}

export type PortfolioAllocationSourceDataType = SummarizedDataType & {
    marketPlace: string;
    code: string;
    quantity: number;
    averagePrice?: number;
    quote?: CurrencyPrice;
}

export type PortfolioSourceDataType = {
    id: string;
    name: string;
    currency: string;
    percPlanned: number;
    allocations: PortfolioAllocationSourceDataType[];
}

export type PortfolioAllocationType = Required<PortfolioAllocationSourceDataType> & Required<SummarizedDataType> & {
    ticker: string;
}

export type PortfolioAllocationRecord = Record<string, PortfolioAllocationType>;

export type PortfolioType = Omit<PortfolioSourceDataType, "allocations" | "currency"> & {
    currency: Currency;
    allocations: PortfolioAllocationRecord;
    total: Required<SummarizedDataType>;
};

export type PortfolioRecord = Record<string, PortfolioType>;

export type PortfolioAllocationsArrayItemType = Omit<PortfolioType, "allocations"> & {
    allocations: PortfolioAllocationType[];
}

export type ScheduledsSourceDataType = {
    id?: string;
    type: string;
    description: string;
    value: {
        currency: string;
        amount: number;
    };
    originAccountId: string;
    targetAccountId?: string; // optional for transfer transaction
    category?: string;
    notes?: string;
    scheduled: {
        type: string;
        startDate: string;
        endDate?: string; // Optional, for scheduleds that do not have an end date
    };
}

export type ScheduledStatemetType = Omit<ScheduledsSourceDataType, "scheduled" | "type" | "value"> & {
    value: CurrencyAmount;
    type: TransactionEnum;
    scheduled: {
        type: Scheduled;
        startDate: Date;
        endDate?: Date; // Optional, for scheduleds that do not have an end date
    }
}

export type ScheduledSourceDataRecord = Record<string, ScheduledStatemetType>;
