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

export type Quote = {
    date: Date;
    from: Currency;
    to: Currency;
    factor: number;
}

export type AccountPosition = {
    id: string;
    account: string;
    type: AccountTypeEnum;
    balance: number;
    currency: Currency;
}

export type AccountBalanceQuote = AccountPosition & {
    balanceQuote: number
}
