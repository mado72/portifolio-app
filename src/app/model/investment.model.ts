import { CurrencyPrice, Exchange } from "./domain.model";

export type QuoteExchangeInfo = {
  original: CurrencyPrice;
  value: CurrencyPrice;
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
