import { InvestmentEnum, TransactionStatus } from "./investment.model";
import { BalanceType, TransactionType } from "./source.model";

export enum Currency {
    BRL = 'BRL',
    USD = 'USD',
    EUR = 'EUR',
    UTC = 'UTC'
} 

export enum CurrencyCode {
    BRL = 'R$',
    USD = '$',
    EUR = '€',
    UTC = 'UTC'
};

export type CurrencyType = `${Currency}`;

export function currencyOf(currency: string) {
    return Currency[currency as keyof typeof Currency];
}

export enum AccountTypeEnum {
    CHECKING = 'CHECKING',
    SAVINGS = 'SAVINGS',
    INVESTMENT = 'INVESTMENT',
    LOAN = 'LOAN',
    OTHER = 'OTHER'
}

export function toCurrencyCode(currency: Currency): CurrencyCode {
    return CurrencyCode[currency as keyof typeof CurrencyCode];
}

export type CurrencyPrice = {
    price: number;
    currency: Currency;
}

export type CurrencyAmount = {
    amount: number;
    currency: Currency;
}

export type Exchange = {
    date: Date;
    from: Currency;
    to: Currency;
    factor: number;
}

export type AccountBalanceExchange = BalanceType & {
    exchange: CurrencyAmount
}

export type AccountBalanceSummaryItem = {
    class: string;
    financial: CurrencyAmount;
    exchange: CurrencyAmount;
    percentagePlanned: number;
    percentageActual: number;
}

export type AccountBalanceSummary = {
    items: AccountBalanceSummaryItem[];
    total: number;
}

export enum TransactionEnum {
    DEPOSIT = 'DEPOSIT',
    INCOME = 'INCOME',
    TRANSFER = 'TRANSFER',
    WITHDRAWAL = 'WITHDRAWAL',
    EXPENSE = 'EXPENSE',
    BUY = 'BUY',
    SELL = 'SELL',
    SUBSCRIPTION = 'SUBSCRIPTION',
    REDEMPTION = 'REDEMPTION',
    OTHER = 'OTHER',
}

export const TransactionDesc = {
    DEPOSIT : "Depósito",
    INCOME : "Renda",
    TRANSFER : "Transferência",
    WITHDRAWAL : "Retirada",
    EXPENSE : "Despesa",
    BUY : "Compra",
    SELL : "Venda",
    SUBSCRIPTION : "Subscrição",
    REDEMPTION : "Resgate",
    OTHER : "Outros",
}

export enum Scheduled {
    ONCE = 'ONCE',
    DIARY = 'DIARY',
    WEEKLY = 'WEEKLY',
    FORTNIGHTLY = 'FORTNIGHTLY',
    MONTHLY = 'MONTHLY',
    QUARTER = 'QUARTER',
    HALF_YEARLY = 'HALF_YEARLY',
    YEARLY = 'YEARLY'
}

export function isTransactionExpense(item: TransactionEnum) {
    return [TransactionEnum.EXPENSE, TransactionEnum.WITHDRAWAL, TransactionEnum.BUY, TransactionEnum.SUBSCRIPTION].includes(item);
}

export function isTransactionDeposit(item: TransactionEnum) {
    return [TransactionEnum.DEPOSIT, TransactionEnum.INCOME, TransactionEnum.SELL, TransactionEnum.REDEMPTION].includes(item);
}

export type Account = {
    id: string;
    name: string;
    type: AccountTypeEnum;
    balance: CurrencyPrice;
}

export type TransactionItem = TransactionType & {
    date: Date;
    account: Account
}

export type ForecastDayItem = TransactionType & {
    day: number;
    done?: boolean;
}

export type ForecastDateItem = TransactionType & {
    date: Date;
    done?: boolean;
}

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
