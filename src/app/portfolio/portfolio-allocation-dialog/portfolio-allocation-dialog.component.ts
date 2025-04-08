import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AssetCodePipe } from '../../utils/pipe/asset-code.pipe';
import { AssetQuoteType } from '../../model/source.model';

export type PorfolioAllocationDataType = {
  portfolio: string,
  ticker: string,
  asset: AssetQuoteType,
  quantity: number,
  percent: number
}
@Component({
  selector: 'app-portfolio-allocation-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    AssetCodePipe
  ],
  templateUrl: './portfolio-allocation-dialog.component.html',
  styleUrl: './portfolio-allocation-dialog.component.scss'
})
export class PortfolioAllocationDialogComponent {

  private dialogRef = inject(MatDialogRef<PortfolioAllocationDialogComponent>);

  readonly data = inject<PorfolioAllocationDataType>(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);

  readonly allocationForm = this.fb.group({
    quantity: this.fb.control(this.data.quantity, [Validators.required, Validators.min(0)]),
    percent: this.fb.control(this.data.percent, [Validators.required, Validators.min(0)]),
  })

  get quantity() {
    return this.allocationForm.get('quantity') as FormControl;
  }

  get percent() {
    return this.allocationForm.get('percent') as FormControl;
  }

  submitForm() {
    this.dialogRef.close(this.formData);
  }

  addQuantity(value: number) {
    this.quantity.setValue(this.quantity.value + value);
  }

  get formData() {
    return {
      ...this.data,
      ...this.allocationForm.value
    }
  }

}
