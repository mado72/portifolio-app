import { TestBed } from '@angular/core/testing';

import { MockRemoteQuotesService } from './mock-remote-quotes.service';

describe('MockRemoteQuotesService', () => {
  let service: MockRemoteQuotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockRemoteQuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
