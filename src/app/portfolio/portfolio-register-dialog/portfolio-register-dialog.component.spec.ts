import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioRegisterDialogComponent } from './portfolio-register-dialog.component';

describe('PortfolioRegisterDialogComponent', () => {
  let component: PortfolioRegisterDialogComponent;
  let fixture: ComponentFixture<PortfolioRegisterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioRegisterDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioRegisterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
