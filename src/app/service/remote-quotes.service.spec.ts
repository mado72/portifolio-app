import { TestBed } from '@angular/core/testing';

import { RemoteQuotesService } from './remote-quotes.service';
import { MockRemoteQuotesService } from './mock-remote-quotes.service';
import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';
import { ImmutableRemoteQuotesService } from './immutable-remote-quotes.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

class MyService {
}

// const dataMock = {
//   portfolio: {
//     name: '',
//     percPlanned: 0,
//     currency: Currency.BRL
//   }

// }

const dialogMock = {
  close: () => {}
};

describe('RemoteQuotesService', () => {
  let service: RemoteQuotesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
          {provider: MockRemoteQuotesService, useClass: MyService},
          {provider: YahooRemoteQuotesService, useClass: MyService},
          {provider: ImmutableRemoteQuotesService, useClass: MyService},
          provideHttpClient(),
          provideHttpClientTesting(),
          provideAnimationsAsync(),
          { provide: MatDialogRef, useValue: dialogMock },
          // { provide: MAT_DIALOG_DATA, useValue: dataMock }
      ]
    });
    service = TestBed.inject(RemoteQuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
