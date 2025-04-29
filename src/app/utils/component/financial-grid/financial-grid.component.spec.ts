import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialGridComponent } from './financial-grid.component';

describe('FinancialGridComponent', () => {
  let component: FinancialGridComponent;
  let fixture: ComponentFixture<FinancialGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
