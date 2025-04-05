import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { Currency } from '../../model/domain.model';
import { PortfolioType } from '../../model/source.model';

export type DialogDataType = {
  title: string;
  portfolio: PortfolioType;
}

@Component({
  selector: 'app-portfolio-register-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    DecimalPipe
  ],
  templateUrl: './portfolio-register-dialog.component.html',
  styleUrl: './portfolio-register-dialog.component.scss'
})
export class PortfolioRegisterDialogComponent {

  readonly data = inject<DialogDataType>(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<PortfolioRegisterDialogComponent>);

  private fb = inject(FormBuilder);

  readonly formPortfolio = this.fb.group({
    name: this.fb.control(this.data.portfolio.name || '', [Validators.required, Validators.minLength(2)]),
    percPlanned: this.fb.control(this.data.portfolio.percPlanned || 0, [Validators.required, Validators.min(0), Validators.max(100)]),
    currency: this.fb.control(this.data.portfolio.currency || Currency.BRL, [Validators.required]),
  });

  readonly currenciesTypes = Object.keys(Currency);

  submitForm() {
    const data = {
      ...this.data.portfolio,
      ...this.formPortfolio.value
    } as PortfolioType;
    this.dialogRef.close(data)
  }

  get name() {
    return this.formPortfolio.get('name') as FormControl<string>;
  }

  get currency() {
    return this.formPortfolio.get('currency') as FormControl<Currency>;
  }

  get percPlanned() {
    return this.formPortfolio.get('percPlanned') as FormControl<number>;
  }

  formatThumb(value: number) {
    return `${value}%`;
  }
}
