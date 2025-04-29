import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Component, input } from '@angular/core';
import { PortfolioRegisterComponent } from '../../portfolio/portfolio-register/portfolio-register.component';
import { ProfitabilityService } from '../../service/profitalibilty.service';
import { ProfitabilityClassesComponent } from './profitability-classes.component';

@Component({
  selector: 'app-portfolio-register',
  standalone: true,
  template: '<div></div>'
})
class PortfolioRegisterComponentMock {
  editable = input(true)
}

describe('ProfitabilityClassesComponent', () => {
  let component: ProfitabilityClassesComponent;
  let fixture: ComponentFixture<ProfitabilityClassesComponent>;
  let profitabilityServiceMock: jasmine.SpyObj<ProfitabilityService> = jasmine.createSpyObj('ProfitabilityService', {
    historical: {},
    current: {}
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitabilityClassesComponent],
      providers: [
        { provide: ProfitabilityService, useFactory: ()=> profitabilityServiceMock }
      ]
    })
    .overrideComponent(ProfitabilityClassesComponent, {
      remove: { imports: [PortfolioRegisterComponent] },
      add: { imports: [PortfolioRegisterComponentMock] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfitabilityClassesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
