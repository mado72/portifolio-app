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
    balance: number;
    currency: Currency;
}

export type AccountBalanceQuote = AccountPosition & {
    balanceQuote: number
}
