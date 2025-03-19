import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-investment-earnings-details',
  standalone: true,
  imports: [
    MatTableModule,
  ],
  templateUrl: './investment-earnings-details.component.html',
  styleUrl: './investment-earnings-details.component.scss'
})
export class InvestmentEarningsDetailsComponent {

}
