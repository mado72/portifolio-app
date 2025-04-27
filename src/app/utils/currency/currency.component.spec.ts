import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyComponent } from './currency.component';
import { provideExchangeServiceMock } from '../../service/service-mock.spec';

describe('CurrencyComponent', () => {
  let component: CurrencyComponent;
  let fixture: ComponentFixture<CurrencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyComponent],
      providers: [
        provideExchangeServiceMock()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
