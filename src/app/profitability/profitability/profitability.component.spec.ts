import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitabilityComponent } from './profitability.component';
import { provideExchangeServiceMock } from '../../service/service-mock.spec';

describe('ProfitabilityComponent', () => {
  let component: ProfitabilityComponent;
  let fixture: ComponentFixture<ProfitabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitabilityComponent],
      providers: [
        provideExchangeServiceMock()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfitabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
