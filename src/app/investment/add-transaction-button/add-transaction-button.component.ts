import { Component, inject, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../service/transaction.service';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-transaction-button',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  providers: [Location, {provide: LocationStrategy, useClass: PathLocationStrategy}],
  templateUrl: './add-transaction-button.component.html',
  styleUrl: './add-transaction-button.component.scss'
})
export class AddTransactionButtonComponent implements OnInit {

  private activatedRoute = inject(ActivatedRoute);

  private transactionService = inject(TransactionService);

  url : string | undefined = undefined;

  ngOnInit() {
    this.url = this.activatedRoute.snapshot.data['back'];
  }

  addTransaction() {
    this.transactionService.createTransaction(this.url);
  }
}

