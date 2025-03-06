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
      { data: new Date(), de: Moeda.REAL, para: Moeda.DOLAR, cotacao: 5.5 },
      { data: new Date(), de: Moeda.DOLAR, para: Moeda.REAL, cotacao: 0.19 },
      { data: new Date(), de: Moeda.REAL, para: Moeda.UTC, cotacao: 3.5 },
      { data: new Date(), de: Moeda.UTC, para: Moeda.REAL, cotacao: 0.28 }
    ];
    return of(cotacoes);
  }

  obterCotacao(de: Moeda, para: Moeda) {
    return this.obterCotacoes().pipe(
      map(cotacoes => cotacoes.find(c => c.de === de && c.para === para))
    );
  }

}
