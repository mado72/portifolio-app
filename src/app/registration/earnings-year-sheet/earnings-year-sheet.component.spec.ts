import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsYearSheetComponent } from './earnings-year-sheet.component';

describe('EarningsYearSheetComponent', () => {
  let component: EarningsYearSheetComponent;
  let fixture: ComponentFixture<EarningsYearSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarningsYearSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarningsYearSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
