import { inject, Injectable } from '@angular/core';
import { ScheduledStatemetType } from '../model/source.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Scheduled, StatementEnum } from '../model/domain.model';
import { SourceService } from './source.service';
import { ScheduledTransactionDialogComponent } from '../statement/scheduled-transaction-dialog/scheduled-transaction-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class StatementService {

  private dialog = inject(MatDialog);

  private sourceService = inject(SourceService);

  openScheduledDialog(title: string, scheduled: ScheduledStatemetType) {
    const dialogRef: MatDialogRef<ScheduledTransactionDialogComponent, ScheduledStatemetType> = 
      this.dialog.open(ScheduledTransactionDialogComponent, {
        data: {
          title,
          scheduled
        }
      });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (!scheduled.id) {
          this.sourceService.addScheduledStatement(result)
        }
        else {
          this.sourceService.updateScheduledStatement([{
            ...result,
            id: scheduled.id
          }]);
        }
      }
    })
  }

  newScheduledStatement() {
    this.openScheduledDialog('Nova transação recorrente', {
      description: '',
      originAccountId: '',
      type: StatementEnum.EXPENSE,
      scheduled: {
        type: Scheduled.MONTHLY,
        startDate: new Date(),
        endDate: undefined
      },
      value: {
        currency: this.sourceService.currencyDefault(),
        amount: 0
      }
    });
}

editScheduledStatement(scheduled: ScheduledStatemetType) {
  this.openScheduledDialog('Edição de transação recorrente', scheduled)  
}

deleteScheduledStatement(scheduledId: string) {
  this.sourceService.deleteScheduledStatement(scheduledId);
}

constructor() { }
}
