import { AccountTypeEnum, Currency, CurrencyPrice, StatementEnum } from "./domain.model";
import { TransactionEnum, TransactionStatus, } from "./investment.model";

export type EntityDataSource = {
    id: string;
}

export type DataSourceType = {
    asset: AssetSourceDataType[],
    balance: BalanceSourceDataType[],
    classConsolidation: ClassConsolidationSourceDataType[],
    earning: IncomeSourceDataType[],
    transaction: TransactionSourceDataType[],
    statement: StatementSourceDataType[],
    portfolio: PortfolioSourceDataType[]    
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

export const fnTrend = (quotation: {initialPrice: number, quote: CurrencyPrice}): TrendType => {
    if (!quotation.quote.price) return 'unchanged';
    const up =  quotation.quote.price > quotation.initialPrice;
    const down = quotation.quote.price < quotation.initialPrice;
    return up? 'up' : down? 'down' : 'unchanged';
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

export const AssetDesc : Record<`${AssetEnum}`, string> = {
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
    id: string;
    account: string;
    balance: number;
    currency: string;
    type: string;
};

export type BalanceType = Omit<BalanceSourceDataType, "balance" | "currency" | "type"> & {
    balance: CurrencyPrice;
    type: AccountTypeEnum;
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

export type TransactionSourceDataType = {
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

export type TransactionType = Omit<TransactionSourceDataType, "date" | "value" | "type" | "status"> & {
    date: Date;
    value: CurrencyPrice;
    type: TransactionEnum;
    status: TransactionStatus;
}

export type TransactionRecord = Record<string, TransactionType>;

export type StatementSourceDataType = {
    id: number;
    type: string;
    movement: string;
    date: number;
    currency: string;
    amount: number;
    account_id: string;
}

export type StatementType = Omit<StatementSourceDataType, "type" | "amount" | "currency"> & {
    type: StatementEnum;
    value: CurrencyPrice;
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
