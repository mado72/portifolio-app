import { Component, inject, Input, OnInit } from '@angular/core';
import { CotacaoService } from '../../service/cotacao.service';
import { ContaService } from '../../service/conta.service';
import { Moeda, moedaSiglaConverter, MoedaSigla } from '../../model/domain.model';
import { forkJoin, map, mergeAll, mergeMap } from 'rxjs';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

type Saldo = {
  id: string;
  conta: string;
  saldo: number;
  saldoMoeda: number;
  moeda: MoedaSigla;
}

@Component({
  selector: 'app-saldos',
  standalone: true,
  imports: [
    DecimalPipe
  ],
  templateUrl: './saldos.component.html',
  styleUrl: './saldos.component.scss'
})
export class SaldosComponent implements OnInit {

  private contaService = inject(ContaService);

  private iniciado = false;

  private _moeda: Moeda = Moeda.BRL;

  public get moeda(): Moeda {
    return this._moeda;
  }

  @Input()
  public set moeda(value: Moeda) {
    this._moeda = value;
    if (this.iniciado) {
      this.atualizarSaldos();
    }
  }

  contas: Saldo[] = []

  ngOnInit(): void {
    this.atualizarSaldos();
  }


  private atualizarSaldos() {
    this.contaService.obterSaldosCotacaoParaMoeda(this.moeda).subscribe(contas => {
      this.contas = contas.map(conta => ({
        ...conta,
        moeda: moedaSiglaConverter(conta.moeda)
      }));
      this.iniciado = true;
    });
  }

  mesmaMoedaComponente(conta: Saldo) {
    const mesmaMoeda = moedaSiglaConverter(this.moeda) === conta.moeda;
    console.log(`mesmaMoeda: ${mesmaMoeda}, moedaConta: ${conta.moeda}, moeda: ${this.moeda}`)
    return mesmaMoeda;
  }
}
