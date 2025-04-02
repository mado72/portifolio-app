import { inject, Injectable } from '@angular/core';
import { RemoteQuotesService } from './remote-quotes.service';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';
import { Observable, of } from 'rxjs';
import { SourceService } from './source.service';

@Injectable({
  providedIn: 'root'
})
export class ImmutableRemoteQuotesService implements IRemoteQuote {

  private sourceService = inject(SourceService);

  constructor() { }
  price(tickers: string[]): Observable<Record<string, QuoteResponse>> {
    return of({})
  }
}
