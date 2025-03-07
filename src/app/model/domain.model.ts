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

export type AccountPosition = {
    id: string;
    account: string;
    type: AccountTypeEnum;
    balance: CurrencyAmount;
}

export type AccountBalanceExchange = AccountPosition & {
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
