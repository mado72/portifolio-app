import { Injectable } from '@angular/core';
import { Quote, Currency } from '../model/domain.model';
import { map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  constructor() { }

  getAllQuotations(): Observable<Quote[]> {
    // Simulação de chamada à API de cotação
    const cotacoes: Quote[] = [
      { date: new Date(), from: Currency.BRL, to: Currency.USD, factor: 1/5.76 },
      { date: new Date(), from: Currency.USD, to: Currency.BRL, factor: 5.76 },
      { date: new Date(), from: Currency.BRL, to: Currency.UTC, factor: 1/5.90 },
      { date: new Date(), from: Currency.UTC, to: Currency.BRL, factor: 5.90 }
    ];
    return of(cotacoes);
  }

  getQuotation(de: Currency, para: Currency) {
    return this.getAllQuotations().pipe(
      map(cotacoes => cotacoes.find(c => c.from === de && c.to === para))
    );
  }

}
