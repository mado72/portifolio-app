import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ExchangeService } from '../../../service/exchange.service';
import { RemoteQuotesService } from '../../../service/remote-quotes.service';
import { ExchangeButtonComponent } from './exchange-button.component';
import { ExchangeView } from '../../../model/investment.model';

class MyService {
  exchangeView = () => "original";
  toggleExchangeView = () => {};

}
describe('ExchangeButtonComponent', () => {
  let component: ExchangeButtonComponent;
  let fixture: ComponentFixture<ExchangeButtonComponent>;
  let remoteQuotesServiceMock: jasmine.SpyObj<RemoteQuotesService>;
  let exchangeServiceMock: jasmine.SpyObj<ExchangeService>;
  let exchangeView = signal<ExchangeView>("original");
  
  beforeEach(async () => {
    remoteQuotesServiceMock = jasmine.createSpyObj('RemoteQuotesServiceMock', [
      'exchanges'
    ])
    exchangeServiceMock = jasmine.createSpyObj('ExchangeService', [
      'exchanges',
      'exchangeView',
      'toggleExchangeView'
    ]);
    exchangeServiceMock.exchangeView.and.returnValue(exchangeView());

    await TestBed.configureTestingModule({
      imports: [ExchangeButtonComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RemoteQuotesService, use: remoteQuotesServiceMock },
        { provide: ExchangeService, useFactory: () => exchangeServiceMock },
      ]
    })
    .compileComponents();

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
    component.toggleViewExchange();
    expect(exchangeServiceMock.toggleExchangeView).toHaveBeenCalled();
  });
});
