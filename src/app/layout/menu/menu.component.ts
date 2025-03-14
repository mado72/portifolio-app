import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  submenu : Record<string, boolean> = {};

  openSubmenu(id: string) {
    const toggle = !this.submenu[id];
    this.submenu = {};
    this.submenu[id] = toggle;
  }
}
