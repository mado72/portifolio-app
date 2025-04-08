import { Directive, ElementRef, HostListener, inject, Input, OnDestroy, Renderer2 } from '@angular/core';
import { SourceService } from '../../service/source.service';
import { Router } from '@angular/router';

@Directive({
  selector: '[appUploadData]',
  standalone: true
})
export class UploadDataDirective implements OnDestroy{

  private sourceService = inject(SourceService);
  private renderer = inject(Renderer2);
  private router = inject(Router);

  @Input() accept = '*.json';
  @Input() multiple = false;
  
  private fileInput!: HTMLInputElement;

  constructor() {
    this.createHiddenInput();
  }

  ngOnDestroy(): void {
    this.renderer.removeChild(document.body, this.fileInput);
  }

  @HostListener('click')
  onClick(): void {
    this.fileInput.click();
  }

  private createHiddenInput(): void {
    this.fileInput = this.renderer.createElement('input') as HTMLInputElement;
    this.renderer.setAttribute(this.fileInput, 'type', 'file');
    this.renderer.setStyle(this.fileInput, 'display', 'none');
    this.renderer.setAttribute(this.fileInput, 'accept', this.accept);
    this.renderer.setProperty(this.fileInput, 'multiple', this.multiple);
    
    this.fileInput.addEventListener('change', (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        this.sourceService.onFileSelected(event);
        this.router.navigateByUrl("/");
      }
      this.clearInput();
    });

    this.renderer.appendChild(document.body, this.fileInput);
  }

  private clearInput(): void {
    this.fileInput.value = '';
  }
}
