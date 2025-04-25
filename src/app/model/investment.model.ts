import { CurrencyType, CurrencyValue, Exchange } from "./domain.model";

export type QuoteExchangeInfo = {
  original: CurrencyValue;
  value: CurrencyValue;
  exchange: Exchange;
}

export enum MarketPlaceEnum {
    BVMF = 'BVMF',
    NASDAQ = 'NASDAQ',
    NYSE = 'NYSE',
    CRYPTO = 'CRYPTO',
    BOND = 'BOND', // Treasury Bonds
    COIN = 'COIN',
    IEX = 'IEX',
    FOREX = 'FOREX',
    BRTD = 'BRTD', // Tesouro Direto
    OTHER = 'OTHER',
}

export type MarketPlaceType = `${MarketPlaceEnum}`;

export function marketPlaceOf(marketPlace: string) {
    return MarketPlaceEnum[marketPlace as keyof typeof MarketPlaceEnum];
}

export enum IncomeEnum {
    DIVIDENDS = 'DIVIDENDS',
    RENT_RETURN = 'RENT_RETURN',
    IOE_RETURN = 'IOE_RETURN', // Intereset on Equity
}

export type IncomeEnumType = `${IncomeEnum}`;

export const IncomeDesc : Record<IncomeEnumType, string> = {
    "DIVIDENDS": 'Dividendos',
    "RENT_RETURN": 'Aluguel',
    "IOE_RETURN": 'JCP',
}

export type Income = {
    id: string;
    date: Date;
    ticker: string;
    amount: number;
    type: IncomeEnum
}

export type AllocationType = {
    percPlanned: number;
    marketValue: number;
}

export type AllocationCalc = AllocationType & {
    percAllocation: number;
    profit: number;
    performance: number;
}

export type AllocationSet = {
    allocations: AllocationCalc[];
    total: AllocationCalc;
}

export enum InvestmentEnum {
    BUY = 'BUY',
    SELL = 'SELL',
    DIVIDENDS = 'DIVIDENDS',
    RENT_RETURN = 'RENT_RETURN',
    IOE_RETURN = 'IOE_RETURN',
    TRANSFER = 'TRANSFER',
    SUBSCRIPTION = 'SUBSCRIPTION',
    REDEMPTION = 'REDEMPTION',
    OTHER = 'OTHER',
}

type InvestmentEnumType = `${InvestmentEnum}`;

export const InvestmentEnumDesc : Record<InvestmentEnumType, string> = {
    "BUY": 'Compra',
    "SELL": 'Venda',
    "DIVIDENDS": 'Dividendos',
    "RENT_RETURN": 'Aluguel',
    "IOE_RETURN": 'JCP',
    "TRANSFER": 'Transferência',
    "SUBSCRIPTION": 'Subscrição',
    "REDEMPTION": 'Resgate',
    "OTHER": 'Outros',
}

export const InvestmentEnumFactor : Record<InvestmentEnum, number> = {
    BUY: 1,
    DIVIDENDS: 1,
    IOE_RETURN: 1,
    OTHER: 0,
    REDEMPTION: 1,
    RENT_RETURN: 1,
    SELL: -1,
    SUBSCRIPTION: -1,
    TRANSFER: 0
}

export enum TransactionStatus {
    PROGRAMING = 'PROGRAMING',
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export const TransactionStatusDesc : Record<`${TransactionStatus}`, string> = {
    "PROGRAMING": "Programada",
    "PENDING": 'Pendente',
    "COMPLETED": 'Confirmada',
    "CANCELLED": 'Cancelada'
}


export type ExchangeReq = {
  from: CurrencyType,
  to: CurrencyType
}

export type ExchangeFactorType = ExchangeReq & {
  factor?: number
}

export type ExchangeStructureType = {
  original: CurrencyValue,
  exchanged: CurrencyValue
}

export type ExchangeView = "original" | "exchanged";
