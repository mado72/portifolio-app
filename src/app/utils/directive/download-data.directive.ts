import { Directive, HostListener, inject } from '@angular/core';
import { SourceService } from '../../service/source.service';
import { lastValueFrom } from 'rxjs';

@Directive({
  selector: '[appDownloadData]',
  standalone: true
})
export class DownloadDataDirective {

  private sourceService = inject(SourceService)

  constructor() { }

  @HostListener('click', ['$event'])
  async onClick(event: Event): Promise<void> {
    event.preventDefault();
    
    this.sourceService.downloadDataAsJson();
  }

}
