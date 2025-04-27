import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioRegisterComponent } from './portfolio-register.component';
import { portfolioServiceMock, provideExchangeServiceMock, providePortfolioServiceMock } from '../../service/service-mock.spec';

describe('PortfolioRegisterComponent', () => {
  let component: PortfolioRegisterComponent;
  let fixture: ComponentFixture<PortfolioRegisterComponent>;

  beforeEach(async () => {
    portfolioServiceMock.portfolioAllocation.and.returnValue([]);
    await TestBed.configureTestingModule({
      imports: [PortfolioRegisterComponent],
      providers: [
        providePortfolioServiceMock(),
        provideExchangeServiceMock()
      ]
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
