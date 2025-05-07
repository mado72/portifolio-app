import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { Currency } from '../../model/domain.model';
import { PortfolioType } from '../../model/source.model';
import { ExchangeService } from '../../service/exchange.service';
import { PortfolioService } from '../../service/portfolio-service';
import { ClassifyService } from '../../service/classify.service';

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

  readonly exchangeService = inject(ExchangeService);

  readonly classifyService = inject(ClassifyService);

  readonly portfolioService = inject(PortfolioService);

  readonly data = inject<DialogDataType>(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<PortfolioRegisterDialogComponent>);

  private fb = inject(FormBuilder);

  classifiers = computed(() => this.classifyService.classifiers());

  readonly formPortfolio = this.fb.group({
    name: this.fb.control(this.data.portfolio.name || '', [Validators.required, Validators.minLength(2)]),
    classify: this.fb.control(this.data.portfolio.classify?.name || '', [Validators.required]),
    percPlanned: this.fb.control(this.data.portfolio.percPlanned || 0, [Validators.required, Validators.min(0), Validators.max(100)]),
    currency: this.fb.control(this.data.portfolio.currency || this.exchangeService.currencyDefault(), [Validators.required]),
  });

  readonly currenciesTypes = Object.keys(Currency);

  submitForm() {
    const classify = this.classifiers().find(classify => classify.name === this.formPortfolio.value.classify) || {
      name: this.formPortfolio.value.classify,
      id: null
    };
    const data = {
      ...this.data.portfolio,
      ...this.formPortfolio.value,
      classify
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
