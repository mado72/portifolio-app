export enum Moeda {
    REAL = 'REAL',
    DOLAR = 'DOLAR',
    UTC = 'UTC'
} 

export type MoedaSigla = 'R$' | 'USD' | 'UTC';

export type Cotacao = {
    data: Date;
    de: Moeda;
    para: Moeda;
    cotacao: number;
}

export type ContaPosicao = {
    id: string;
    conta: string;
    saldo: number;
    moeda: Moeda;
}
