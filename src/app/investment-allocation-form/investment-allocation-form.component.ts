import { JsonPipe } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, Output, Signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SelectOnFocusDirective } from '../utils/directive/select-on-focus.directive';

export type InvestmentAllocationField = {
  id: string,
  qty: number,
  name: string
}

@Component({
  selector: 'app-investment-allocation-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    SelectOnFocusDirective,
    JsonPipe
  ],
  templateUrl: './investment-allocation-form.component.html',
  styleUrl: './investment-allocation-form.component.scss'
})
export class InvestmentAllocationFormComponent {

  private fb = inject(FormBuilder);

  quantity = input<number | null>(null);

  allocations = input<Record<string, { id: string; qty: number; name: string; allocated: number }>>({});

  allocationForm = this.fb.group({
    allocations: this.fb.array([] as ReturnType<InvestmentAllocationFormComponent['createAllocationGroupForm']>[])
  }, {
    validators: [
      isAllAllocationsDoneValidator(this.quantity, 'allocations')
    ]
  });

  @Output() formDataChanged = new EventEmitter<{ id: string; qty: number; name: string }[]>();

  @Output() formIsValid = new EventEmitter<boolean>();

  @Output() formIsTouched = new EventEmitter<boolean>();

  @Output() formErrorsChanged = new EventEmitter<ValidationErrors | null>()

  constructor() {
    effect(() => {
      this.allocationForm.setControl('allocations', this.createAllocationsArrayForm(
        Object.values(this.allocations())));
    })
  }

  createAllocationsArrayForm(allocations: { id: string; qty: number; name: string; allocated: number }[]) {
    return this.fb.array(allocations.map(allocation => {
      const allocationFields = this.createAllocationGroupForm(allocation);
      return allocationFields;
    }));
  }

  createAllocationGroupForm(allocation: { id: string; qty: number; name: string; allocated: number }) {
    const idField = this.fb.control<string | null>(allocation.id,     [Validators.required, Validators.minLength(1)]);
    const nameField = this.fb.control<string | null>(allocation.name, [Validators.required, Validators.minLength(1)]);
    const qtyField = this.fb.control<number | null>(allocation.qty,   [Validators.required, Validators.min(0)]);
    return this.fb.group({
      id: idField,
      qty: qtyField,
      name: nameField
    });
  }

  ngOnInit(): void {
    this.allocationForm.valueChanges.subscribe(() => {
      const allocations: Required<typeof this.allocationForm.value.allocations> = this.allocationForm.value.allocations || [];
      this.formDataChanged.emit(allocations.map(allocation=>({
        id: allocation.id as string,
        name: allocation.name as string,
        qty: allocation.qty as number
      })));
      this.formErrorsChanged.emit(this.allocationForm.errors);
      this.formIsValid.emit(this.allocationForm.valid);
      this.formIsTouched.emit(this.allocationForm.touched);
    });
  }

  formValue() {
    return (this.allocationForm.value.allocations || []) as InvestmentAllocationField[];
  }

  formErrors() {
    return this.allocationForm.errors;
  }

  getAllocationsControls() {
    return (this.allocationForm.get('allocations') as FormArray).controls;
  }

  getAllocationId(idx: number): any {
    return this.getAllocationsControls()[idx].get('id')?.value;
  }

  getAllocationName(idx: number) {
    return this.getAllocationsControls()[idx].get('name')?.value;
  }

  badgeValue(idx: number) {
    return this.allocations()[idx].allocated;
  }
}

function isAllAllocationsDoneValidator(
    quantityValue: Signal<number | null>, 
    allocationFieldName: string) {
  
  return (control: AbstractControl): ValidationErrors | null => {

    const allocationField = control.get(allocationFieldName) as FormArray<FormGroup<{ id: FormControl<string | null>, qty: FormControl<number | null> }>>;

    const quantity = quantityValue();

    if (!allocationField || !(allocationField instanceof FormArray)) {
      return {
        "invalidSetup": {
          "quantityValue": !quantity,
          "allocationField": !allocationField,
        }
      }
    }

    if (allocationField.errors) {
      return { "allocations": allocationField.errors }
    }

    const allocations = control.value['allocations'] as { id: string, qty: number }[];
    const total = (allocations).reduce((acc, vl) => acc += vl.qty || 0, 0);

    if (quantity != total) {
      return {
        "notMatched": {
          quantity,
          total
        }
      }
    }
    return null;
  }
}

