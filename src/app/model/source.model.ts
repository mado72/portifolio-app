import { AccountTypeEnum, Currency, CurrencyAmount, CurrencyType, StatementEnum } from "./domain.model";
import { AssetEnum, TransactionEnum, TransactionStatus } from "./investment.model";

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
      amount: number;
      currency: string;
  };
  lastUpdate: string;
  type: string;
  name: string;
};

export type AssetType = Omit<AssetSourceDataType, "quote" | "type" | "lastUpdate"> & {
    lastUpdate: Date;
    quote: CurrencyAmount;
    type: AssetEnum
}

export type AssetRecord = Record<string, AssetType>;

export type BalanceSourceDataType = {
    id: string;
    account: string;
    balance: number;
    currency: string;
    type: string;
};

export type BalanceType = Omit<BalanceSourceDataType, "balance" | "currency" | "type"> & {
    balance: CurrencyAmount;
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
    financial: CurrencyAmount;
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
        amount: number;
    };
    type: string;
    status: string;
    brokerage?: number;
}

export type TransactionType = Omit<TransactionSourceDataType, "date" | "value" | "type" | "status"> & {
    date: Date;
    value: CurrencyAmount;
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
    value: CurrencyAmount;
}

export type StatementRecord = Record<string, StatementType>;

export type PortfolioAllocationSourceDataType = {
    marketPlace: string;
    code: string;
    quantity: number;
    percPlanned: number;
    initialValue: number;
    marketValue: number;
    averagePrice?: number;
    quote?: CurrencyAmount;
    profit?: number;
    percAllocation?: number;
    performance?: number;
}

export type PortfolioSourceDataType = {
    id: string;
    name: string;
    currency: string;
    allocations: PortfolioAllocationSourceDataType[];
}

export type PortfolioAllocationType = Required<PortfolioAllocationSourceDataType> & {
    averagePrice: number;
    ticker: string;
}

export type PortfolioAllocationRecord = Record<string, PortfolioAllocationType>;

export type PortfolioType = Omit<PortfolioSourceDataType, "allocations" | "currency"> & {
    currency: Currency;
    allocations: PortfolioAllocationRecord
};

export type PortfolioRecord = Record<string, PortfolioType>;
