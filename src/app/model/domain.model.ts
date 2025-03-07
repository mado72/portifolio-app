export enum Moeda {
    BRL = 'BRL',
    USD = 'USD',
    UTC = 'UTC'
} 

export enum MoedaSigla {
    BRL = 'R$',
    USD = '$',
    UTC = 'UTC'
};

export function moedaSiglaConverter(moeda: Moeda): MoedaSigla {
    return MoedaSigla[moeda as keyof typeof MoedaSigla];
}

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
