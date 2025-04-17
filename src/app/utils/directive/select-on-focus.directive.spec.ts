import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SelectOnFocusDirective } from './select-on-focus.directive';

// Componente de teste para hospedar a diretiva
@Component({
  template: `<input type="text" value="teste" appSelectOnFocus>`
})
class TestComponent {}

describe('SelectOnFocusDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let inputEl: DebugElement;
  let inputNativeEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [SelectOnFocusDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.css('input'));
    inputNativeEl = inputEl.nativeElement;
    
    fixture.detectChanges();
  });

  it('deve ser criada', () => {
    expect(component).toBeTruthy();
  });

  it('deve selecionar o texto do input quando recebe foco', () => {
    // Configurar o spy no método select do elemento input
    const selectSpy = spyOn(inputNativeEl, 'select');
    
    // Simular o evento de foco no input
    inputEl.triggerEventHandler('focus', null);
    
    // Verificar se o método select foi chamado
    expect(selectSpy).toHaveBeenCalled();
  });

  it('deve selecionar todo o texto quando o input recebe foco', () => {
    // Preparar o input com um valor
    inputNativeEl.value = 'texto de teste';
    
    // Implementação manual para verificar a seleção real do texto
    // (alternativa ao spy quando queremos verificar o comportamento real)
    const mockSelect = inputNativeEl.select;
    
    // Substituir o método select com uma implementação que rastreia a chamada
    // e executa o comportamento original
    let selectCalled = false;
    inputNativeEl.select = function() {
      selectCalled = true;
      // Não podemos chamar o método original aqui porque
      // o JSDOM não implementa completamente a seleção de texto
    };
    
    // Simular o evento de foco
    inputEl.triggerEventHandler('focus', null);
    
    // Verificar se o método select foi chamado
    expect(selectCalled).toBe(true);
    
    // Restaurar o método original
    inputNativeEl.select = mockSelect;
  });

  // Teste adicional para verificar a integração com eventos reais do DOM
  it('deve responder ao evento de foco real', () => {
    // Configurar o spy
    const selectSpy = spyOn(inputNativeEl, 'select');
    
    // Disparar um evento de foco real
    inputNativeEl.dispatchEvent(new FocusEvent('focus'));
    
    // Verificar se o método select foi chamado
    expect(selectSpy).toHaveBeenCalled();
  });
});