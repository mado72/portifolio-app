import { Signal } from "@angular/core";
import { AbstractControl, AsyncValidatorFn, FormControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { Observable } from "rxjs";
export function watchField() {
  return (formControl: FormControl) => {
    if (!formControl.parent) {
      return null;
    }

    Object.values(formControl.parent.controls).forEach((value) => {
      if (value !== formControl) {
        value.updateValueAndValidity();
      }
    });

    return null;
  };
}


export function validateIf<T>(
  conditionalFieldName: string,
  conditionalValue: (val: T) => boolean,
  validators: ValidatorFn | ValidatorFn[],
  errorNamespace = 'conditional'
): ValidatorFn {
  return (formControl) => {
    if (!formControl.parent) {
      return null;
    }

    let error = null;

    const conditionalField = formControl.parent.get(conditionalFieldName)
    if (!conditionalField) {
      console.warn('Conditional field not found');

      return null;
    }

    if (conditionalValue(conditionalField.value as T)) {
      const validatorArr = Array.isArray(validators) ? validators : [validators];

      error = validatorArr.some((validator) => validator(formControl) !== null);
    }

    if (errorNamespace && error) {
      const customError = {} as any;
      customError[errorNamespace] = error;
      error = customError;
    }

    return error;
  };
}


export function isAccountMatchedValidator(accounts: Signal<{ account: string, id: string }[]>): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return new Observable<ValidationErrors | null>(subscriber => {
      const value = control.value as string;
      if (!accounts().find(account => account.id === value)) {
        subscriber.next({ "accountNotFound": { value } });
      }
      else {
        subscriber.next(null);
      }
      subscriber.complete();
    })
  }
}