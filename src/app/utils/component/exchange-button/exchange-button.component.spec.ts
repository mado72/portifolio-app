import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeButtonComponent } from './exchange-button.component';
import { QuoteService } from '../../../service/quote.service';

class MyService {
  exchangeView = () => "original";
  toggleExchangeView = () => {};

}
describe('ExchangeButtonComponent', () => {
  let component: ExchangeButtonComponent;
  let fixture: ComponentFixture<ExchangeButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExchangeButtonComponent],
      providers: [
        { provide: QuoteService, useClass: MyService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangeButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
