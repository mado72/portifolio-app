import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocationSummaryComponent } from './allocation-summary.component';

describe('AllocationSummaryComponent', () => {
  let component: AllocationSummaryComponent;
  let fixture: ComponentFixture<AllocationSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllocationSummaryComponent]
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
