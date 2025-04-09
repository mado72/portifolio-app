import { TestBed } from '@angular/core/testing';
import { EmptyDataDirective } from './empty-data.directive';
import { SourceService } from '../../service/source.service';

class MyService {

}

describe('EmptyDataDirective', () => {

  let directive: EmptyDataDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: EmptyDataDirective, useClass: EmptyDataDirective },
        { provide: SourceService, useClass: MyService },
      ]
    })
    directive = TestBed.inject(EmptyDataDirective);
  })
  
  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
