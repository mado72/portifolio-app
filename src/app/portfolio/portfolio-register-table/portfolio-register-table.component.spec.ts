import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioRegisterTableComponent } from './portfolio-register-table.component';

describe('PortfolioRegisterTableComponent', () => {
  let component: PortfolioRegisterTableComponent;
  let fixture: ComponentFixture<PortfolioRegisterTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioRegisterTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioRegisterTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
