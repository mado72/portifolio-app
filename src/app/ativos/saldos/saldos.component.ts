import { DecimalPipe } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { Moeda, MoedaSigla, moedaSiglaConverter } from '../../model/domain.model';
import { ContaService } from '../../service/conta.service';
import { MatTableModule } from '@angular/material/table';

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
    DecimalPipe,
    MatTableModule,
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
