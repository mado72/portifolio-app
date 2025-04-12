import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummarizePortfolioClassComponent } from './summarize-portfolio-class.component';

describe('SummarizePortfolioClassComponent', () => {
  let component: SummarizePortfolioClassComponent;
  let fixture: ComponentFixture<SummarizePortfolioClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummarizePortfolioClassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummarizePortfolioClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
