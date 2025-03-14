import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentAssetsPortletComponent } from './investment-assets-portlet.component';

describe('InvestmentAssetsPortletComponent', () => {
  let component: InvestmentAssetsPortletComponent;
  let fixture: ComponentFixture<InvestmentAssetsPortletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentAssetsPortletComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentAssetsPortletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
