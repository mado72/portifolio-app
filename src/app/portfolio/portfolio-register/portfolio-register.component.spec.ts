import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioRegisterComponent } from './portfolio-register.component';

describe('PortfolioRegisterComponent', () => {
  let component: PortfolioRegisterComponent;
  let fixture: ComponentFixture<PortfolioRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
