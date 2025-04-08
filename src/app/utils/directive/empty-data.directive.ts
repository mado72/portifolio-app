import { Directive, HostListener, inject } from '@angular/core';
import { SourceService } from '../../service/source.service';

@Directive({
  selector: '[appEmptyData]',
  standalone: true
})
export class EmptyDataDirective {

  private sourceService = inject(SourceService)

  constructor() { }

  @HostListener('click', ['$event'])
  async onClick(event: Event): Promise<void> {
    event.preventDefault();
    
    this.sourceService.emptyAllData();
  }

}
