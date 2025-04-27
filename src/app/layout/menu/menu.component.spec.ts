import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Currency } from '../../model/domain.model';
import { ExchangeService } from '../../service/exchange.service';
import { MenuComponent } from './menu.component';

const EXCHANGES = {
  USD: { EUR: 0.85 },
  EUR: { USD: 1.18 }
};
const exchanges$ = signal<any>(EXCHANGES);

const currencyDefault = signal<Currency>(Currency.USD);
const exchangeView = signal("original");

export class ExchangeServiceMock {
  exchanges = exchanges$;
  currencyDefault = currencyDefault;
  exchangeView = exchangeView;
  currencyToSymbol = (arg: any) => '' + arg;
  test = () => 'My test';
}

export function provideExchangeServiceMock() {
  return [
    { provide: ExchangeService, useClass: ExchangeServiceMock },
    { provide: exchanges$, use: exchanges$ }
  ]
}

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let exchangeServiceMock: jasmine.SpyObj<ExchangeServiceMock>;

  beforeEach(async () => {
    exchangeServiceMock = jasmine.createSpyObj('ExchangeService', [
      'currencyToSymbol'
    ], {
      currencyDefault: currencyDefault,
      exchangeView: exchangeView,
      exchanges: exchanges$,
    })

    currencyDefault.set(Currency.USD);
    exchangeView.set("original");
    exchanges$.set(EXCHANGES);

    // exchangeServiceMock.exchanges.and.returnValue = EXCHANGES;

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideExchangeServiceMock()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle menu state', () => {
    expect(component.menuClosed).toBeTrue();
    component.toggleMenu();
    expect(component.menuClosed).toBeFalse();
    component.toggleMenu();
    expect(component.menuClosed).toBeTrue();
  });

  it('should open and close submenu', () => {
    const submenuId = 'testSubmenu';
    expect(component.submenu[submenuId]).toBeUndefined();

    component.openSubmenu(submenuId);
    expect(component.submenu[submenuId]).toBeTrue();

    component.openSubmenu(submenuId);
    expect(component.submenu[submenuId]).toBeFalse();
  });

  it('should close all submenus', () => {
    component.submenu = { submenu1: true, submenu2: true };
    component.closeMenus();
    expect(Object.keys(component.submenu).length).toBe(0);
  });

  it('should hide a specific submenu', () => {
    const submenuId = 'testSubmenu';
    component.submenu[submenuId] = true;
    component.hideSubmenu(submenuId);
    expect(component.submenu[submenuId]).toBeUndefined();
  });

  it('should compute exchanges correctly', () => {
    currencyDefault.set(Currency.USD);
    exchangeServiceMock.currencyToSymbol.and.callFake((currency) => `${currency}`);

    const exchanges = component.exchanges();

    expect(exchanges).toEqual([
      { symbol: 'EUR', currency: Currency.EUR, factor: 1.18 }
    ]);
  });

  it('should return empty exchanges when no data is available', () => {
    const exchangeService = TestBed.inject(ExchangeService);
    (exchangeService.exchanges as unknown as WritableSignal<Record<string, any>>).set({});
    const exchanges = component.exchanges();
    expect(exchanges).toEqual([]);
  });
});
