import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { ContaPosicao, Cotacao, Moeda } from '../model/domain.model';
import { CotacaoService } from './cotacao.service';

@Injectable({
  providedIn: 'root'
})
export class ContaService {

  private cotacaoService = inject(CotacaoService);

  constructor() { }

  obterSaldos() : Observable<ContaPosicao[]>{
    const saldos: ContaPosicao[] = [
      { id: '1', conta: 'Itaú', saldo: 370.36, moeda: Moeda.REAL },
      { id: '2', conta: 'NuBank', saldo: 11.07, moeda: Moeda.REAL },
      { id: '3', conta: 'Nu Bank Finfor', saldo: 0, moeda: Moeda.REAL },
      { id: '4', conta: 'Rico', saldo: 0, moeda: Moeda.REAL },
      { id: '5', conta: 'Rico Inv.', saldo: 0, moeda: Moeda.REAL },
      { id: '6', conta: 'Nomad', saldo: 7.83, moeda: Moeda.REAL },
      { id: '7', conta: 'BMG Vasco', saldo: 0, moeda: Moeda.REAL },
      { id: '8', conta: 'BTG', saldo: 0, moeda: Moeda.REAL },
      { id: '9', conta: 'BTG Inv.', saldo: 0, moeda: Moeda.REAL },
      { id: '10', conta: 'XP', saldo: 0, moeda: Moeda.REAL },
      { id: '11', conta: 'XP Inv.', saldo: 386.49, moeda: Moeda.REAL },
      { id: '12', conta: 'Binance', saldo: 0, moeda: Moeda.DOLAR }
    ];

    return of(saldos);
  }

  obterSaldosCotacaoParaMoeda(moeda: Moeda) {
    return forkJoin({
      contas: this.obterSaldos(),
      cotacoes: this.cotacaoService.obterCotacoes()
    }).pipe(
      map(saldosCotacoes => {
        return saldosCotacoes.contas.map(conta => {
          const cotacao = saldosCotacoes.cotacoes.find(c => c.de === conta.moeda && c.para === moeda);
          return {
            id: conta.id,
            conta: conta.conta,
            saldo: conta.saldo * (cotacao?.cotacao || 1),
            saldoMoeda: conta.saldo,
            moeda: conta.moeda
          };
        });
      })
    )

  }
}
