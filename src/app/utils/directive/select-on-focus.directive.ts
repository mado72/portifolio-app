import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appSelectOnFocus]',
  standalone: true
})
export class SelectOnFocusDirective {

  constructor(private elementRef: ElementRef) {}

  @HostListener('focus') onFocus() {
    const inputElement: HTMLInputElement = this.elementRef.nativeElement;
    inputElement.select();
  }
}