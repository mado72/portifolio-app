import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsEntryDialogComponent } from './earnings-entry-dialog.component';

describe('EarningsEntryDialogComponent', () => {
  let component: EarningsEntryDialogComponent;
  let fixture: ComponentFixture<EarningsEntryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarningsEntryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarningsEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
