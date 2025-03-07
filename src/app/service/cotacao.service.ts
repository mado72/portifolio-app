import { Injectable } from '@angular/core';
import { Cotacao, Moeda } from '../model/domain.model';
import { map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CotacaoService {

  constructor() { }

  obterCotacoes(): Observable<Cotacao[]> {
    // Simulação de chamada à API de cotação
    const cotacoes: Cotacao[] = [
      { data: new Date(), de: Moeda.BRL, para: Moeda.USD, cotacao: 1/5.76 },
      { data: new Date(), de: Moeda.USD, para: Moeda.BRL, cotacao: 5.76 },
      { data: new Date(), de: Moeda.BRL, para: Moeda.UTC, cotacao: 1/5.90 },
      { data: new Date(), de: Moeda.UTC, para: Moeda.BRL, cotacao: 5.90 }
    ];
    return of(cotacoes);
  }

  obterCotacao(de: Moeda, para: Moeda) {
    return this.obterCotacoes().pipe(
      map(cotacoes => cotacoes.find(c => c.de === de && c.para === para))
    );
  }

}
