import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeYearSheetFilterComponent } from './income-year-sheet-filter.component';

describe('IncomeYearSheetFilterComponent', () => {
  let component: IncomeYearSheetFilterComponent;
  let fixture: ComponentFixture<IncomeYearSheetFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeYearSheetFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomeYearSheetFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
