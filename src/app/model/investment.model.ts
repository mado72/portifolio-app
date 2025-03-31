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

export const AssetDesc : Record<`${AssetEnum}`, string> = {
    STOCK: 'Ação',
    BOND: 'Fundo',
    ETF: 'ETF',
    CRYPTO: 'Crypto',
    REAL_ESTATE: 'FI',
    CURRENCY: 'Moeda',
    OTHER: 'Outro'
}

export type Asset = {
    name: string;
    code: string;
    type: AssetEnum;
    lastUpdate: Date;
    controlByQty: boolean;
    marketPlace: string;
    quote: CurrencyAmount;
    trend: TrendType;
    initialQuote?: number;
    manualQuote?: boolean;
}

export type AssetAllocation = Asset & {
    quantity: number;
    percPlanned: number;
    averagePrice: number;
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
    CRYPTO = 'CRYPTO',
    COIN = 'COIN',
    IEX = 'IEX',
    FOREX = 'FOREX',
    BRTD = 'TD', // Tesouro Direto
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

export enum TransactionEnum {
    BUY = 'BUY',
    SELL = 'SELL',
    DIVIDENDS = 'DIVIDENDS',
    RENT_RETURN = 'RENT_RETURN',
    IOE_RETURN = 'IOE_RETURN',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
    SUBSCRIPTION = 'SUBSCRIPTION',
    REDEMPTION = 'REDEMPTION',
    OTHER = 'OTHER',
}

type TransactionEnumType = `${TransactionEnum}`;

export const TransactionEnumDesc : Record<TransactionEnumType, string> = {
    "BUY": 'Compra',
    "SELL": 'Venda',
    "DIVIDENDS": 'Dividendos',
    "RENT_RETURN": 'Aluguel',
    "IOE_RETURN": 'JCP',
    "TRANSFER_IN": 'Transf. Entrada',
    "TRANSFER_OUT": 'Transf. Saída',
    "SUBSCRIPTION": 'Subscrição',
    "REDEMPTION": 'Resgate',
    "OTHER": 'Outros',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    REVERSED = 'REVERSED'
}

type TransactionStatusType = `${TransactionStatus}`;

export const TransactionStatusDesc : Record<TransactionStatusType, string> = {
    "PENDING": 'Pendente',
    "COMPLETED": 'Confirmada',
    "CANCELLED": 'Cancelada',
    "REVERSED": 'Estornada'
}

// export type TransactionType = {
//     id?: string;
//     ticker: string;
//     date: Date;
//     accountId: string;
//     quantity: number;
//     quote: number;
//     value: CurrencyAmount;
//     type: TransactionEnumType;
//     status: TransactionStatus;
//     brokerage?: number; // corretagem
// }
