import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeYearSheetComponent } from './income-year-sheet.component';

describe('IncomeYearSheetComponent', () => {
  let component: IncomeYearSheetComponent;
  let fixture: ComponentFixture<IncomeYearSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeYearSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomeYearSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
