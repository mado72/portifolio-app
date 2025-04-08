import { inject, Injectable } from '@angular/core';
import { RecurrenceStatemetType } from '../model/source.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Recurrence, StatementEnum } from '../model/domain.model';
import { SourceService } from './source.service';
import { RecurrenceTransactionDialogComponent } from '../statement/recurrence-transaction-dialog/recurrence-transaction-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class StatementService {

  private dialog = inject(MatDialog);

  private sourceService = inject(SourceService);

  openRecurrenceDialog(title: string, recurrence: RecurrenceStatemetType) {
    const dialogRef: MatDialogRef<RecurrenceTransactionDialogComponent, RecurrenceStatemetType> = 
      this.dialog.open(RecurrenceTransactionDialogComponent, {
        data: {
          title,
          recurrence
        }
      });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (!recurrence.id) {
          this.sourceService.addRecurrenceStatement(result)
        }
        else {
          this.sourceService.updateRecurrenceStatement([{
            ...result,
            id: recurrence.id
          }]);
        }
      }
    })
  }

  newRecurrenceStatement() {
    this.openRecurrenceDialog('Nova transação recorrente', {
      description: '',
      originAccountId: '',
      type: StatementEnum.EXPENSE,
      recurrence: {
        type: Recurrence.MONTHLY,
        startDate: new Date()
      },
      value: {
        currency: this.sourceService.currencyDefault(),
        amount: 0
      }
    });
}

editRecurrenceStatement(recurrence: RecurrenceStatemetType) {
  this.openRecurrenceDialog('Edição de transação recorrente', recurrence)  
}

deleteRecurrenceStatement(recurrenceId: string) {
  this.sourceService.deleteRecurrenceStatement(recurrenceId);
}

constructor() { }
}
