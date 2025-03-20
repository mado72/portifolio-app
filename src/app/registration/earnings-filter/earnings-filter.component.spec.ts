import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsFilterComponent } from './earnings-filter.component';

describe('EarningsFilterComponent', () => {
  let component: EarningsFilterComponent;
  let fixture: ComponentFixture<EarningsFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarningsFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarningsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
