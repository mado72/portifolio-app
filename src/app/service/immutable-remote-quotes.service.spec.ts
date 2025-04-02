import { TestBed } from '@angular/core/testing';

import { ImmutableRemoteQuotesService } from './immutable-remote-quotes.service';

describe('ImmutableRemoteQuotesService', () => {
  let service: ImmutableRemoteQuotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImmutableRemoteQuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
