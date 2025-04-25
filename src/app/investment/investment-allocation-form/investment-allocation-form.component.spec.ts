import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentAllocationFormComponent } from './investment-allocation-form.component';

describe('InvestmentAllocationFormComponent', () => {
  let component: InvestmentAllocationFormComponent;
  let fixture: ComponentFixture<InvestmentAllocationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentAllocationFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentAllocationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
