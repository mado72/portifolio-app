import { Component, inject, Input, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Moeda } from '../../model/domain.model';
import { ContaService } from '../../service/conta.service';
import { CurrencyComponent } from '../../utils/currency/currency.component';
import { JsonPipe } from '@angular/common';

type Saldo = {
  id: string;
  conta: string;
  saldo: number;
  saldoMoeda: number;
  moeda: Moeda;
  selecionado: boolean;
}

@Component({
  selector: 'app-saldos',
  standalone: true,
  imports: [
    JsonPipe,
    MatTableModule,
    CurrencyComponent
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
      this.obterSaldos();
    }
  }

  contas: Saldo[] = []

  saldoTotal: number = 0;

  ngOnInit(): void {
    this.obterSaldos();
  }


  private obterSaldos() {
    this.saldoTotal = 0;
    this.contaService.obterSaldosCotacaoParaMoeda(this.moeda).subscribe(contas => {
      this.iniciado = true;
      this.contas = contas.map(conta=> ({...conta, selecionado: true}));
      this.atualizarTotais();
    });
  }

  private atualizarTotais() {
    this.saldoTotal = this.contas
      .filter(conta=> conta.selecionado)
      .map(conta => this.mesmaMoedaComponente(conta) ? conta.saldo : conta.saldoMoeda)
      .reduce((acc, vl) => acc += vl, 0);
  }

  mesmaMoedaComponente(conta: Saldo) {
    return this.moeda === conta.moeda;
  }


}
