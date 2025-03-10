import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentAssetsTableComponent } from './investment-assets-table.component';

describe('InvestmentAssetsTableComponent', () => {
  let component: InvestmentAssetsTableComponent;
  let fixture: ComponentFixture<InvestmentAssetsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentAssetsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentAssetsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
