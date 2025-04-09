import { TestBed } from '@angular/core/testing';
import { UploadDataDirective } from './upload-data.directive';
import { SourceService } from '../../service/source.service';
import { Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

class MyService {

  ev = {
    target: {
      files: []
    }
  };

  addEventListener = (evName: string, listenerFn: {(ev: any): void}) => {
    listenerFn(this.ev);
  }

  createElement =  (): any=>({
    addEventListener : this.addEventListener
  });

  setAttribute =  (): void=>{};
  setStyle =  (): void=>{};
  setProperty =  (): void=>{};
  appendChild = (): void=>{};
  removeChild = (): void=>{};

}
describe('UploadDataDirective', () => {
  let directive !: UploadDataDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: UploadDataDirective, useClass: UploadDataDirective },
        { provide: SourceService, useClass: MyService },
        { provide: Renderer2, useClass: MyService},
        { provide: Router, useClass: MyService }
      ]
    })
    directive = TestBed.inject(UploadDataDirective);
    let c = new MyService();
  })
  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
