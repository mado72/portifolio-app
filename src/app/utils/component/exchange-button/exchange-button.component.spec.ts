import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeService } from '../../../service/exchange.service';
import { RemoteQuotesService } from '../../../service/remote-quotes.service';
import { ExchangeButtonComponent } from './exchange-button.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideExchangeServiceMock } from '../../../layout/menu/menu.component.spec';

class MyService {
  exchangeView = () => "original";
  toggleExchangeView = () => {};

}
describe('ExchangeButtonComponent', () => {
  let component: ExchangeButtonComponent;
  let fixture: ComponentFixture<ExchangeButtonComponent>;
  let remoteQuotesServiceMock: jasmine.SpyObj<RemoteQuotesService>;
  let exchangeServiceMock: jasmine.SpyObj<ExchangeService>;

  beforeEach(async () => {
    remoteQuotesServiceMock = jasmine.createSpyObj('RemoteQuotesServiceMock', [
      'exchanges'
    ])
    exchangeServiceMock = jasmine.createSpyObj('ExchangeService', [
      'exchanges',
      'exchangeView',
      'toggleExchangeView'
    ])
    await TestBed.configureTestingModule({
      imports: [ExchangeButtonComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideExchangeServiceMock(),
        { provide: RemoteQuotesService, use: remoteQuotesServiceMock },
      ]
    })
    .compileComponents();

    debugger;
    const remoteQuotesService = TestBed.inject(RemoteQuotesService);
    console.log(remoteQuotesService.exchanges)

    fixture = TestBed.createComponent(ExchangeButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call exchangeView from ExchangeService when exchangeView is accessed', () => {
    exchangeServiceMock.exchangeView.and.returnValue('original');
    expect(component.exchangeView()).toBe('original');
  });

  it('should call toggleExchangeView from ExchangeService when toggleViewExchange is invoked', () => {
    debugger;
    component.toggleViewExchange();
    expect(exchangeServiceMock.toggleExchangeView).toHaveBeenCalled();
  });
});
