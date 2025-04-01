import { TestBed } from '@angular/core/testing';

import { RemoteQuotesService } from './remote-quotes.service';

describe('RemoteQuotesService', () => {
  let service: RemoteQuotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RemoteQuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
