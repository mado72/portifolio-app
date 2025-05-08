import { ElementRef } from '@angular/core';
import { MaskNumberDirective } from './mask-number.directive';

describe('MaskNumberDirective', () => {
  it('should create an instance', () => {
    const mockElementRef = { nativeElement: document.createElement('input') } as ElementRef<HTMLInputElement>;
    const mockRenderer2 = jasmine.createSpyObj('Renderer2', ['setAttribute', 'addClass', 'removeClass']);
    const directive = new MaskNumberDirective(mockElementRef, mockRenderer2);
    expect(directive).toBeTruthy();
  });
});
