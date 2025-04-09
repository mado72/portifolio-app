import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledTransactionListComponent } from './scheduled-transaction-list.component';
import { SourceService } from '../../service/source.service';
import { StatementService } from '../../service/statement.service';
import { BalanceService } from '../../service/balance.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

class MyService {
  getAllBalances = () => [];
  scheduledSource = () => ({});
}

describe('ScheduledTransactionListComponent', () => {
  let component: ScheduledTransactionListComponent;
  let fixture: ComponentFixture<ScheduledTransactionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduledTransactionListComponent],
      providers: [
        {provide: SourceService, useClass: MyService},
        {provide: StatementService, useClass: MyService},
        {provide: BalanceService, useClass: MyService},
        provideAnimationsAsync()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduledTransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
