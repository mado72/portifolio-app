import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { Currency } from '../../model/domain.model';
import { PortfolioType } from '../../model/source.model';
import { SourceService } from '../../service/source.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PortfolioService } from '../../service/portfolio-service';

export type DialogDataType = {
  title: string;
  portfolio: PortfolioType;
}

@Component({
  selector: 'app-portfolio-register-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
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

  readonly sourceService = inject(SourceService);

  readonly portfolioService = inject(PortfolioService);

  readonly data = inject<DialogDataType>(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<PortfolioRegisterDialogComponent>);

  private fb = inject(FormBuilder);

  classes = computed(() => 
    Object.values(this.portfolioService.portfolios())
      .filter(portfolio => !!portfolio.class)
      .reduce((acc, portfolio) => {
        acc.add(portfolio.class);
        return acc;
      }, new Set()));

  readonly formPortfolio = this.fb.group({
    name: this.fb.control(this.data.portfolio.name || '', [Validators.required, Validators.minLength(2)]),
    class: this.fb.control(this.data.portfolio.class || '', [Validators.required]),
    percPlanned: this.fb.control(this.data.portfolio.percPlanned || 0, [Validators.required, Validators.min(0), Validators.max(100)]),
    currency: this.fb.control(this.data.portfolio.currency || this.sourceService.currencyDefault(), [Validators.required]),
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
