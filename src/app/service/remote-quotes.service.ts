import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { differenceInMinutes } from 'date-fns';
import { forkJoin, map, timer, zipAll } from 'rxjs';
import { MarketPlaceEnum } from '../model/investment.model';
import { IRemoteQuote } from '../model/remote-quote.model';
import { AssetQuoteType } from '../model/source.model';
import { ImmutableRemoteQuotesService } from './immutable-remote-quotes.service';
import { MockRemoteQuotesService } from './mock-remote-quotes.service';
import { SourceService } from './source.service';
import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';

@Injectable({
  providedIn: 'root'
})
export class RemoteQuotesService {

  private mockRemoteQuotesService = inject(MockRemoteQuotesService);
  private yahooRemoteQuotesService = inject(YahooRemoteQuotesService);
  private immutableRemoteQuotesService = inject(ImmutableRemoteQuotesService);
  
  private serviceMap = new Map<MarketPlaceEnum, IRemoteQuote>([
    [MarketPlaceEnum.BVMF, this.yahooRemoteQuotesService],
    [MarketPlaceEnum.NASDAQ, this.mockRemoteQuotesService],
    [MarketPlaceEnum.NYSE, this.mockRemoteQuotesService],
    [MarketPlaceEnum.CRYPTO, this.mockRemoteQuotesService],
    [MarketPlaceEnum.COIN, this.mockRemoteQuotesService],
    [MarketPlaceEnum.BRTD, this.yahooRemoteQuotesService]
  ]);

  private sourceService = inject(SourceService);

  protected latestQuote = signal<Record<string, AssetQuoteType>>({});

  assetsQuoted = computed(() => {
    const assets = this.sourceService.assertSource();
    const quotes = this.latestQuote();
    const lastUpdate = this.lastUpdate();
    return Object.entries(assets)
      .reduce((acc, [ticker, asset]) => {
        acc[ticker] = {
          ...asset,
          ...quotes[ticker] || null,
          lastUpdate
        };
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
      const now = new Date();
      if (differenceInMinutes(now, this.lastUpdate()) > 15) {
        return Object.entries(this.assetsQuoted()).reduce((acc, [ticker, asset]) => {
          if (differenceInMinutes(now, asset.lastUpdate) > 15) {
            acc[ticker] = asset;
          }
          return acc;
        }, {} as Record<string, AssetQuoteType>)
      }
      return null;
    })
  ).subscribe(assets => {
    if (!! assets && Object.keys(assets).length) {
      this.updateQuotes(assets);
    }
  });

  constructor() {
    effect(async () => {
      this.updateQuotes(this.sourceService.assertSource());
    })
  }

  updateQuotes(assets: Record<string, AssetQuoteType>) {
    if (!Object.keys(assets).length) return;

    this.prepareRequestsToUpdateQuotes(assets).subscribe(quotes=>{
      
      const updated = Object.entries(quotes).reduce((acc, [ticker, quote]) => {
        const asset = assets[ticker];
        acc[ticker] = {
          ...assets[ticker],
          quote: {
            price: quote.price,
            currency: asset.quote.currency
          },
          trend: quote.price === quote.open ? 'unchanged' : quote.price > quote.open ? 'up' : 'down'
        }
        return acc;
      }, {} as Record<string, AssetQuoteType>);

      this.lastUpdate.set(new Date());
      this.latestQuote.set(updated);

    })
  }

  destroy() {
    this.timerId.unsubscribe();
  }

  getRemoteQuotesService(marketPlace: MarketPlaceEnum) {
    const serviceToken = this.serviceMap.get(marketPlace);

    if (!serviceToken) {
      return this.immutableRemoteQuotesService;
    }

    return serviceToken;
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
