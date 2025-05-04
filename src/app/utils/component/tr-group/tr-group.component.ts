import { Component } from '@angular/core';

@Component({
    selector: 'tr-group',
    standalone: true,
    template: `<ng-content></ng-content>`,
    styles: [`
    :host { 
        display: contents; 
    }
    `],
})
export class TrGroupComponent { }