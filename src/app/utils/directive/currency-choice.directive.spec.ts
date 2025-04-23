import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Currency } from '../../model/domain.model';
import { ExchangeService } from '../../service/exchange.service';
import { CurrencyChoiceDirective } from './currency-choice.directive';

// Componente de teste para hospedar a diretiva
@Component({
  template: `
    <button [appCurrencyChoice]="Currency.USD">USD</button>
    <button [appCurrencyChoice]="Currency.EUR">EUR</button>
    <button [appCurrencyChoice]="'BRL'">BRL</button>
  `,
  styles: [`
  .active-currency{
    background: red;
  }
  `],
  standalone: true,
  imports: [CurrencyChoiceDirective]
})
class TestComponent {
  Currency = Currency;
}

describe('CurrencyChoiceDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let exchangeServiceMock: jasmine.SpyObj<ExchangeService>;
  let currencyDefaultSpy: jasmine.Spy;
  let currencySignal: any;
  
  beforeEach(async () => {
    currencySignal = signal(Currency.USD);
    
    // Criar mock para o ExchangeService
    exchangeServiceMock = jasmine.createSpyObj('ExchangeService', [], {
      get currencyDefault() {
        return currencySignal;
      },
      set currencyDefault(value: Currency) {
        currencySignal.set(value);
      }
    });
    
    
    await TestBed.configureTestingModule({
      imports: [TestComponent, CurrencyChoiceDirective],
      providers: [
        { provide: ExchangeService, useValue: exchangeServiceMock }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  });
  
  it('should create an instance', () => {
    const buttons = fixture.debugElement.queryAll(By.directive(CurrencyChoiceDirective));
    expect(buttons.length).toBe(3);
    
    const directive = buttons[0].injector.get(CurrencyChoiceDirective);
    expect(directive).toBeTruthy();
  });
  
  it('should add active-currency class to element with default currency', () => {
    const buttons = fixture.debugElement.queryAll(By.directive(CurrencyChoiceDirective));
    
    // O primeiro botão deve ter a classe active-currency porque mockamos USD como padrão
    expect(buttons[0].nativeElement.classList.contains('active-currency')).toBeTrue();
    
    // Os outros botões não devem ter a classe active-currency
    expect(buttons[1].nativeElement.classList.contains('active-currency')).toBeFalse();
    expect(buttons[2].nativeElement.classList.contains('active-currency')).toBeFalse();
  });
  
  it('should call sourceService.currencyDefault.set when clicked', () => {
    spyOn(exchangeServiceMock["currencyDefault"], "set");
    const buttons = fixture.debugElement.queryAll(By.directive(CurrencyChoiceDirective));
    
    // Clicar no segundo botão (EUR)
    buttons[1].nativeElement.click();
    fixture.detectChanges();
    
    // Verificar se o método set foi chamado com Currency.EUR
    expect(exchangeServiceMock.currencyDefault.set).toHaveBeenCalledWith(Currency.EUR);
    
    // Clicar no terceiro botão (BRL)
    buttons[2].nativeElement.click();
    fixture.detectChanges();
    
    // Verificar se o método set foi chamado com Currency.BRL
    expect(exchangeServiceMock.currencyDefault.set).toHaveBeenCalledWith(Currency.BRL);
  });
  
  it('should update active-currency class when currency changes', () => {
    const buttons = fixture.debugElement.queryAll(By.directive(CurrencyChoiceDirective));
    
    // Inicialmente, USD é o padrão
    expect(buttons[0].nativeElement.classList.contains('active-currency')).toBeTrue();
    expect(buttons[1].nativeElement.classList.contains('active-currency')).toBeFalse();
    
    // Simular mudança de moeda padrão para EUR
    currencySignal.set(Currency.EUR);
    
    // Forçar detecção de mudanças para acionar o efeito
    fixture.detectChanges();
    
    // Agora EUR deve ser ativo
    expect(buttons[0].nativeElement.classList.contains('active-currency')).toBeFalse();
    expect(buttons[1].nativeElement.classList.contains('active-currency')).toBeTrue();
  });
  
  it('should handle string input for currency', () => {
    spyOn(exchangeServiceMock["currencyDefault"], "set");
    const buttons = fixture.debugElement.queryAll(By.directive(CurrencyChoiceDirective));
    
    // Clicar no botão com string 'BRL'
    buttons[2].nativeElement.click();
    fixture.detectChanges();
    
    // Verificar se o método set foi chamado com Currency.BRL
    expect(exchangeServiceMock.currencyDefault.set).toHaveBeenCalledWith(Currency.BRL);
  });
  
  it('should correctly compute active state', () => {
    const buttons = fixture.debugElement.queryAll(By.directive(CurrencyChoiceDirective));
    
    // Obter instâncias da diretiva
    const usdDirective = buttons[0].injector.get(CurrencyChoiceDirective);
    const eurDirective = buttons[1].injector.get(CurrencyChoiceDirective);
    
    // Com USD como padrão, apenas a diretiva USD deve estar ativa
    expect(usdDirective.active()).toBeTrue();
    expect(eurDirective.active()).toBeFalse();
    
    // Mudar para EUR
    currencySignal.set(Currency.EUR);
    fixture.detectChanges();
    
    // Agora EUR deve estar ativo
    expect(usdDirective.active()).toBeFalse();
    expect(eurDirective.active()).toBeTrue();
  });
});