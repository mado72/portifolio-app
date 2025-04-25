import { FormControl, ValidatorFn } from "@angular/forms";
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