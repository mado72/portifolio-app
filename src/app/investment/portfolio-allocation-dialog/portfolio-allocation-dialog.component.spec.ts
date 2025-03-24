import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioAllocationDialogComponent } from './portfolio-allocation-dialog.component';

describe('PortfolioAllocationDialogComponent', () => {
  let component: PortfolioAllocationDialogComponent;
  let fixture: ComponentFixture<PortfolioAllocationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioAllocationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioAllocationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
