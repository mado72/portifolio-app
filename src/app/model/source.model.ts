import { AccountTypeEnum, Currency, CurrencyAmount, CurrencyPrice, Recurrence, StatementEnum } from "./domain.model";
import { TransactionEnum, TransactionStatus, } from "./investment.model";

export type EntityDataSource = {
    id: string;
}

export type DataSourceType = {
    asset: AssetSourceDataType[],
    balance: BalanceSourceDataType[],
    classConsolidation: ClassConsolidationSourceDataType[],
    earning: IncomeSourceDataType[],
    transaction: InvestmentTransactionSourceDataType[],
    portfolio: PortfolioSourceDataType[],
    statement: StatementSourceDataType[],
    recurrences: RecurrencesSourceDataType[],
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
    type: TransactionEnum;
    status: TransactionStatus;
}

export type TransactionRecord = Record<string, InvestmentTransactionType>;

export type StatementSourceDataType = {
    id: string;
    type: string;
    description: string;
    date: number;
    currency: string;
    amount: number;
    account_id: string;
    recurrence_ref?: string;
}

export type StatementType = Omit<StatementSourceDataType, "type" | "amount" | "currency" | "account_id" | "recurrence_ref"> & {
    type: StatementEnum;
    value: CurrencyAmount;
    originAccountId: string;
    recurrenceRef?: string;
}

export type StatementRecord = Record<string, StatementType>;

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

export type RecurrencesSourceDataType = {
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
    recurrence: {
        type: string;
        startDate: string;
        endDate?: string; // Optional, for recurrences that do not have an end date
    };
}

export type RecurrenceStatemetType = Omit<RecurrencesSourceDataType, "recurrence" | "type" | "value"> & {
    value: CurrencyAmount;
    type: StatementEnum;
    recurrence: {
        type: Recurrence;
        startDate: Date;
        endDate?: Date; // Optional, for recurrences that do not have an end date
    }
}

export type RecurrenceSourceDataRecord = Record<string, RecurrenceStatemetType>;
