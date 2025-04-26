import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { BalanceService } from '../../service/balance.service';
import { ImportType, MassiveService } from '../../service/massive.service';
import { isAccountMatchedValidator } from '../../utils/validator/custom.validator';


@Component({
  selector: 'app-massive-import',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatAutocompleteModule,
    NgTemplateOutlet
  ],
  templateUrl: './massive-import.component.html',
  styleUrl: './massive-import.component.scss'
})
export class MassiveImportComponent {

  private fb = inject(FormBuilder);

  private balanceService = inject(BalanceService);

  private massiveService = inject(MassiveService);

  accounts = computed(() => this.balanceService.getAccounts());
  
  accountName = signal('');

  optionsAccount = computed(() => {
    const accountName = this.accountName();
    return this.accounts()
      .filter(acc => acc.account.toLocaleLowerCase().includes(accountName.toLocaleLowerCase()));
  });

  accountNameDisplay = (id: string): string => this.accounts()
    .filter(acc => acc.id === id)
    .map(acc => acc.account).find(_ => true) || '';

  form = this.fb.group({
    data: ['', [Validators.required, Validators.minLength(4)]],
    accountId: ['', Validators.required, isAccountMatchedValidator(this.accounts)]
  });

  parsed: ImportType[] | null = null;
  
  error: string[] | null = null;

  constructor() {
    this.listenDataField();
    this.listenAccountIdToFillAccountName
  }

  private listenDataField() {
    this.form.get('data')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.parsed = null;
        this.error?.push('Campo vazio');
        this.form.get('data')?.setErrors({ invalid: true });
        return;
      }
      try {
        const parseResult = this.massiveService.parseJson(value);
        this.parsed = parseResult.parsed;

        if (! this.parsed) {
          this.error = parseResult.error;
        }
        console.log(this.parsed);
      } catch (error: any) {
        if (! (error instanceof Error) && ! (error.message.endsWith('is not valid JSON'))) {
          this.error = [error.toString()];
          this.parsed = null;
        } 
        else {
          const parseResult = this.massiveService.parseCsv(value);
          if (parseResult.error.length > 0) {
            this.error = parseResult.error;
          } else {
            this.error = [];
            this.parsed = parseResult.parsed;
          }
        }
      }
      this.form.get('data')?.setErrors(this.error?.length ? { invalid: true } : null);
    });
  }

  private listenAccountIdToFillAccountName() {
    const accountIdField = this.form.get("accountId") as FormControl;
    accountIdField.valueChanges.pipe(
      startWith(accountIdField.value),
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(accountName => this.accountName.set(accountName));
  }

  import() {
    if (!this.form.valid) {
      return
    }
    const accountId = this.form.get('accountId')?.value;
    const parsed = this.parsed;
    if (!parsed || !accountId) {
      return;
    }
    this.massiveService.import(accountId, parsed).subscribe(() => {
      window.alert('Importação realizada com sucesso!');
      this.form.reset();
    });
  }

}
