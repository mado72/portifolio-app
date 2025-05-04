import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TransactionService } from '../../service/transaction.service';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-back-transaction-button',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './back-transaction-button.component.html',
  styleUrl: './back-transaction-button.component.scss'
})
export class BackTransactionButtonComponent implements OnInit {

  private activatedRoute = inject(ActivatedRoute);

  private router = inject(Router);

  enableBackButton = signal(false);

  ngOnInit(): void {
    const url = this.activatedRoute.snapshot.data["back"];
    this.enableBackButton.set(url && url.length > 0);
  }

  back() {
    const url = this.activatedRoute.snapshot.data["back"];
    if (url && url.length > 0) {
      this.router.navigate([url]);
    } else {
      this.router.navigate(['']);
    }
  }
}
