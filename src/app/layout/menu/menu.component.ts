import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DownloadDataDirective } from '../../../data/util/download-data.directive';
import { UploadDataDirective } from '../../utils/upload-data.directive';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink,
    DownloadDataDirective,
    UploadDataDirective
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  submenu : Record<string, boolean> = {};

  menuClosed = true;

  toggleMenu() {
    this.menuClosed =!this.menuClosed;
  }

  openSubmenu(id: string) {
    const toggle = !this.submenu[id];
    this.submenu = {};
    this.submenu[id] = toggle;
  }

  hideSubmenu(id: string) {
    delete this.submenu[id];
  }
}
