import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocationSummaryComponent } from './allocation-summary.component';
import { BalanceService } from '../../service/balance.service';

class MyService {
  getAllocationSummary = () => ([]);
}
describe('AllocationSummaryComponent', () => {
  let component: AllocationSummaryComponent;
  let fixture: ComponentFixture<AllocationSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllocationSummaryComponent],
      providers: [
        { provide: BalanceService, useClass: MyService}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllocationSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
