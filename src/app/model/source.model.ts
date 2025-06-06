import { AccountTypeEnum, Currency, CurrencyValue, Scheduled, TransactionEnum } from "./domain.model";
import { InvestmentEnum, TransactionStatus, } from "./investment.model";

export type Ticker = string;

export type EntityDataSource = {
    id: string;
}

export type AssetSourceRawType = {
    ticker: string;
    controlByQty: boolean;
    quote: {
        value: number;
        currency: string;
    };
    lastUpdate: string;
    type: string;
    name: string;
    manualQuote?: boolean;
};

export type TrendType = 'up' | 'down' | 'unchanged';

export const fnTrend = (quotation: { initialPrice: number, quote: CurrencyValue }): TrendType => {
    if (!quotation.quote.value) return 'unchanged';
    const up = quotation.quote.value > quotation.initialPrice;
    const down = quotation.quote.value < quotation.initialPrice;
    return up ? 'up' : down ? 'down' : 'unchanged';
};


export enum AssetEnum {
    STOCK = "STOCK",
    BOND = "BOND",
    FUND = "FUND",
    ETF = "ETF",
    CRYPTO = "CRYPTO",
    REAL_ESTATE = "REAL_ESTATE",
    CURRENCY = "CURRENCY",
    OTHER = "OTHER"
}

export const AssetDesc: Record<`${AssetEnum}`, string> = {
    STOCK: 'Ação',
    BOND: 'Título',
    FUND: 'Fundo',
    ETF: 'ETF',
    CRYPTO: 'Crypto',
    REAL_ESTATE: 'FII/RE',
    CURRENCY: 'Moeda',
    OTHER: 'Outro'
}

export type AssetQuoteType = Omit<AssetSourceRawType, "code" | "marketPlace" | "quote" | "type" | "lastUpdate"> & {
    ticker: string;
    initialPrice: number;
    lastUpdate: Date;
    quote: CurrencyValue;
    type: AssetEnum;
    trend: TrendType
}

export type AssetQuoteRecord = Record<string, AssetQuoteType>;

export type BalanceSourceRawType = {
    id?: string;
    accountName: string;
    balance: number;
    currency: string;
    type: string;
    date: string;
};

export type BalanceType = Omit<BalanceSourceRawType, "balance" | "currency" | "type" | "date"> & {
    balance: CurrencyValue;
    type: AccountTypeEnum;
    date: Date;
}

export type BalanceRecord = Record<string, BalanceType>;

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

export type InvestmentTransactionSourceRawType = {
    id: string;
    ticker: Ticker;
    date: string;
    accountId: string;
    quantity: number;
    quote: number;
    value: {
        currency: string;
        value: number;
    };
    type: string;
    status: string;
    fees?: number;
}

export type InvestmentTransactionType = Omit<InvestmentTransactionSourceRawType, "date" | "value" | "type" | "status"> & {
    date: Date;
    value: CurrencyValue;
    type: InvestmentEnum;
    status: TransactionStatus;
}

export type InvestmentTransactionRecord = Record<string, InvestmentTransactionType>;

export type TransactionSourceRawType = {
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

export type TransactionType = Omit<TransactionSourceRawType, "date" | "type" | "amount" | "currency" | "account_id" | "scheduled_ref" | "status"> & {
    date: Date;
    type: TransactionEnum;
    value: CurrencyValue;
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

export type ClassifyType = {
    id: string;
    name: string;
}

export type PortfolioAllocationSourceRawType = SummarizedDataType & {
    ticker: Ticker;
    transactions: {id: string; quantity: number}[];
}

export type PortfolioAllocationStructureType = Required<PortfolioAllocationSourceRawType> & Required<SummarizedDataType & {quantity: number}>;

export class PortfolioAllocation {
    data!: PortfolioAllocationStructureType;
    
    constructor(data: PortfolioAllocationStructureType) {
        this.data = {...data,
            percAllocation: Number((data.percAllocation || 0).toPrecision(7)),
            profit: Number((data.profit || 0).toPrecision(4)),
            performance: Number((data.performance || 0).toPrecision(7))
        };
    }
}

export type PortfolioAllocationRecord = Record<string, PortfolioAllocation>;

export type PortfolioAllocationsArrayItemType = Omit<PortfolioType, "allocations"> & {
    allocations: PortfolioAllocation[];
}

export type PortfolioSourceRawType = {
    id: string;
    name: string;
    currency: string;
    classifyId?: string;
    percPlanned: number;
    allocations: PortfolioAllocationSourceRawType[];
}

export type PortfolioType = Omit<PortfolioSourceRawType, "allocations" | "currency" | "classifyId"> & {
    currency: Currency;
    classify?: ClassifyType;
    allocations: PortfolioAllocationRecord;
    total: Required<SummarizedDataType>;
};

export type PortfolioRecord = Record<string, PortfolioType>;

export type ScheduledsSourceDataType = {
    id?: string;
    type: string;
    description: string;
    amount: {
        currency: string;
        value: number;
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
    amount: CurrencyValue;
    type: TransactionEnum;
    scheduled: {
        type: Scheduled;
        startDate: Date;
        endDate?: Date; // Optional, for scheduleds that do not have an end date
    }
}

export type ScheduledSourceDataRecord = Record<string, ScheduledStatemetType>;

export type ProfitabilityDataRawItem = { [classifyId: string]: number[] }

export type ProfitabilityDataRaw = { [year: string | number]: { [classify: string]: number[] } }
