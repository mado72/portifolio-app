import { computed, effect, inject, Injectable, InjectionToken, Injector, Provider, signal } from '@angular/core';
import { differenceInMinutes } from 'date-fns';
import { firstValueFrom, forkJoin, map, timer, zipAll } from 'rxjs';
import { MarketPlaceEnum } from '../model/investment.model';
import { IRemoteQuote } from '../model/remote-quote.model';
import { AssetQuoteType } from '../model/source.model';
import { ImmutableRemoteQuotesService } from './immutable-remote-quotes.service';
import { MockRemoteQuotesService } from './mock-remote-quotes.service';
import { SourceService } from './source.service';
import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';

const YAHOO_REMOTEQUOTESERVICE = new InjectionToken<IRemoteQuote>('YahooRemoteQuotesService');
const MOCK_REMOTEQUOTESERVICE = new InjectionToken<IRemoteQuote>('MockRemoteQuotesService');
const IMMUTABLE_REMOTEQUOTESERVICE = new InjectionToken<IRemoteQuote>('ImmutableRemoteQuotesService');

const REMOTEQUOTES_PROVIDERS: Provider[] = [
  { provide: YAHOO_REMOTEQUOTESERVICE, useClass: YahooRemoteQuotesService },
  { provide: MOCK_REMOTEQUOTESERVICE, useClass: MockRemoteQuotesService },
  { provide: IMMUTABLE_REMOTEQUOTESERVICE, useClass: ImmutableRemoteQuotesService },
]

const SERVICE_MAP = new Map<MarketPlaceEnum, InjectionToken<IRemoteQuote>>([
  [MarketPlaceEnum.BVMF, YAHOO_REMOTEQUOTESERVICE],
  [MarketPlaceEnum.NASDAQ, MOCK_REMOTEQUOTESERVICE],
  [MarketPlaceEnum.NYSE, MOCK_REMOTEQUOTESERVICE],
  [MarketPlaceEnum.CRYPTO, MOCK_REMOTEQUOTESERVICE],
  [MarketPlaceEnum.COIN, MOCK_REMOTEQUOTESERVICE],
  [MarketPlaceEnum.BRTD, YAHOO_REMOTEQUOTESERVICE],
])

@Injectable({
  providedIn: 'root'
})
export class RemoteQuotesService {

  private injector = Injector.create({ providers: REMOTEQUOTES_PROVIDERS })

  private sourceService = inject(SourceService);

  assetsQuoted = signal<Record<string, AssetQuoteType>>({});

  assetsPendding = computed(() => {
    const assets = this.sourceService.assertSource();
    const quotes = this.assetsQuoted();
    // TODO: Acrescentar lógica de atividade da cotação.
    return Object.entries(assets).filter(([ticker, _]) => !quotes[ticker] || differenceInMinutes(new Date(), quotes[ticker].lastUpdate) > 15)
      .reduce((acc, [ticker, asset]) => {
        acc[ticker] = asset;
        return acc;
      }, {} as { [ticker: string]: AssetQuoteType })
  })

  readonly lastUpdate = signal<Date>(new Date());

  readonly quotesRequests = computed(() => {
    const assets = this.sourceService.assertSource();
    return this.prepareRequestsToUpdateQuotes(assets);
  });

  timerId = timer(30 * 60 * 1000).pipe(
    map(() => {

      const assets = this.sourceService.assertSource();
      this.assetsQuoted.set(assets);
      return this.prepareRequestsToUpdateQuotes(assets);
    })
  ).subscribe(assets => {
    this.sourceService.updateAsset(Object.values(assets));
  });

  constructor() {
    effect(async () => {
      const pending = this.assetsPendding();
      const quotes = Object.values(await firstValueFrom(this.prepareRequestsToUpdateQuotes(pending)));
      const assets = quotes.map(quote => {
        return {
         ...pending[quote.ticker],
          quote
        } as AssetQuoteType
      });
      this.sourceService.updateAsset(assets);
    }, {
      allowSignalWrites: true
    })
  }

  destroy() {
    this.timerId.unsubscribe();
  }

  getRemoteQuotesService(marketPlace: MarketPlaceEnum) {
    const serviceToken = SERVICE_MAP.get(marketPlace);

    if (!serviceToken) {
      return this.injector.get(IMMUTABLE_REMOTEQUOTESERVICE);
    }

    return this.injector.get(serviceToken);
  }

  prepareRequestsToUpdateQuotes(assets: Record<string, AssetQuoteType>) {
    const marketPlaceRec = Object.keys(assets).reduce((acc, ticker) => {
      const marketPlaceCode = ticker.split(':')[0];
      acc[marketPlaceCode] = [...(acc[marketPlaceCode] || []), ticker]
      return acc;
    }, {} as {[marketplace: string]: string[]});

    return forkJoin(
      Object.entries(marketPlaceRec).map(([marketPlaceCode, tickers]) => {
        const marketPlace = MarketPlaceEnum[marketPlaceCode as keyof typeof MarketPlaceEnum];
        const service = this.getRemoteQuotesService(marketPlace);
        return service.price(tickers);
      })).pipe(
        zipAll(),
        map(results=>{
          return results.reduce((acc, item) => {
              acc = {...acc, ...item};
              return acc;
            });
        })
      );
  }

}
