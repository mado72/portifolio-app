import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsFilterComponent } from './earnings-filter.component';
import { PortfolioService } from '../../service/portfolio-service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

class MyService {
  portfolios = () => ({});
}

describe('EarningsFilterComponent', () => {
  let component: EarningsFilterComponent;
  let fixture: ComponentFixture<EarningsFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarningsFilterComponent],
      providers: [
        { provide: PortfolioService, useClass: MyService },
        provideNativeDateAdapter(),
        provideAnimationsAsync()
      ]
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
