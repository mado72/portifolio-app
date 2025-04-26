import { TestBed } from '@angular/core/testing';

import { MassiveService } from './massive.service';

describe('MassiveService', () => {
  let service: MassiveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MassiveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
