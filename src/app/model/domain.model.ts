import { TransactionEnum, TransactionStatus } from "./investment.model";
import { BalanceType } from "./source.model";

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
    exchange: CurrencyPrice
}

export type AccountBalanceSummaryItem = {
    class: string;
    financial: CurrencyPrice;
    exchange: CurrencyPrice;
    percentagePlanned: number;
    percentageActual: number;
}

export type AccountBalanceSummary = {
    items: AccountBalanceSummaryItem[];
    total: number;
}

export enum StatementEnum {
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

export const StatementDesc = {
    DEPOSIT : "Depósito",
    INCOME : "Renda",
    TRANSFER : "Transf. Entrada",
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

export function isStatementExpense(item: StatementEnum) {
    return [StatementEnum.EXPENSE, StatementEnum.WITHDRAWAL, StatementEnum.BUY, StatementEnum.SUBSCRIPTION].includes(item);
}

export function isStatementDeposit(item: StatementEnum) {
    return [StatementEnum.DEPOSIT, StatementEnum.INCOME, StatementEnum.SELL].includes(item);
}

export type Account = {
    id: string;
    name: string;
    type: AccountTypeEnum;
    balance: CurrencyPrice;
}

export type StatementEnumKeys = `${StatementEnum}`;

type Statement$ = {
    id?: string;
    type: StatementEnum;
    description: string;
    value: CurrencyAmount;
    originAccountId: string;
    targetAccounId?: string; // optional for transfer transaction
    category?: string;
    notes?: string;
}

export type StatementItem = Statement$ & {
    date: Date;
    account: Account
}

export type ForecastDayItem = Statement$ & {
    day: number;
    done?: boolean;
}

export type ForecastDateItem = Statement$ & {
    date: Date;
    done?: boolean;
}
