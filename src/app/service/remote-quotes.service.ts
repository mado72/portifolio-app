import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import { filter, forkJoin, interval, map, Observable, of, tap, zipAll } from 'rxjs';
import { MarketPlaceEnum } from '../model/investment.model';
import { IRemoteQuote, QuoteResponse } from '../model/remote-quote.model';
import { AssetQuoteType, Ticker } from '../model/source.model';
import { ImmutableRemoteQuotesService } from './immutable-remote-quotes.service';
import { MockRemoteQuotesService } from './mock-remote-quotes.service';
import { getMarketPlaceCode } from './quote.service';
import { SourceService } from './source.service';
import { YahooRemoteQuotesService } from './yahoo-remote-quotes.service';
import { CurrencyType } from '../model/domain.model';
import { CoinService } from './coin-remote.service';

@Injectable({
  providedIn: 'root'
})
export class RemoteQuotesService {

  private mockRemoteQuotesService = inject(MockRemoteQuotesService);
  private yahooRemoteQuotesService = inject(YahooRemoteQuotesService);
  private immutableRemoteQuotesService = inject(ImmutableRemoteQuotesService);

  private serviceMap = new Map<MarketPlaceEnum, IRemoteQuote>([
    [MarketPlaceEnum.BVMF, this.yahooRemoteQuotesService],
    [MarketPlaceEnum.NASDAQ, this.yahooRemoteQuotesService],
    [MarketPlaceEnum.NYSE, this.yahooRemoteQuotesService],
    [MarketPlaceEnum.CRYPTO, this.mockRemoteQuotesService],
    [MarketPlaceEnum.COIN, this.immutableRemoteQuotesService],
    [MarketPlaceEnum.BRTD, this.yahooRemoteQuotesService]
  ]);

  private sourceService = inject(SourceService);

  private coinService = inject(CoinService);

  protected latestQuote = signal<Record<string, AssetQuoteType>>({});

  assetsQuoted = computed(() => {
    const assets = this.sourceService.assertSource();
    const quotes = this.latestQuote();
    const lastUpdate = this.lastUpdate().value;
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

  readonly exchanges = signal({} as Record<CurrencyType, Record<CurrencyType, number>>);

  readonly lastUpdate = signal<{ old?: Date, value: Date }>({ value: new Date() });

  readonly quotesRequests = computed(() => {
    const assets = this.sourceService.assertSource();
    return this.prepareRequestsToUpdateQuotes(Object.keys(assets));
  });

  timertId = interval(1 * 60 * 1000).pipe(
    filter(() => {
      const diffLastUpdate = differenceInMinutes(this.lastUpdate().value, this.lastUpdate().old || new Date());
      return diffLastUpdate > 15;
    })
  ).subscribe(assets => {
    this.updateQuotes(this.assetsQuoted()).subscribe();
    this.updateExchanges();
  });

  constructor() {
    this.updateQuotes(this.sourceService.assertSource()).subscribe();
    this.updateExchanges();
    effect(() => {
      const diffLastUpdate = differenceInSeconds(this.lastUpdate().value, this.lastUpdate().old as Date);
      if (diffLastUpdate > 0) {
        this.updateQuotes(this.sourceService.assertSource()).subscribe();
      }
    })
  }

  updateQuotes(assets: Record<Ticker, AssetQuoteType>): Observable<Record<string, QuoteResponse>> {
    if (!Object.keys(assets).length) return of({});

    const tickers = Object.entries(assets)
      .filter(([ticker, asset])=>!asset.manualQuote)
      .map(([ticker, asset])=>ticker);

    return this.prepareRequestsToUpdateQuotes(tickers).pipe(
      tap(quotes => {
        const updated = Object.entries(quotes).reduce((acc, [ticker, quote]) => {
          const asset = assets[ticker];
          acc[ticker] = {
            ...assets[ticker],
            quote: {
              value: quote.price,
              currency: asset.quote.currency
            },
            trend: quote.price === quote.open ? 'unchanged' : quote.price > quote.open ? 'up' : 'down'
          }
          return acc;
        }, {} as Record<string, AssetQuoteType>);

        this.lastUpdate.update(d => {
          return { old: d.value, value: new Date() };
        });
        this.latestQuote.set(updated);
        this.sourceService.updateAsset(Object.values(updated));
      }))
  }

  updateExchanges() {
    this.coinService.getExchanges().subscribe(exchanges => this.exchanges.set(exchanges));
  }

  destroy() {
    this.timertId.unsubscribe();
  }

  getRemoteQuotesService(marketPlace: MarketPlaceEnum) {
    const serviceToken = this.serviceMap.get(marketPlace);

    if (!serviceToken) {
      return this.immutableRemoteQuotesService;
    }

    return serviceToken;
  }

  /**
   * Retrieves a remote quote for a given marketplace and code.
   *
   * @param marketPlace - The marketplace identifier, which can be a `MarketPlaceEnum` value or a string.
   *                      If a string is provided, it will be converted to the corresponding `MarketPlaceEnum` value.
   * @param code - The code of the asset or item for which the quote is being retrieved.
   * @returns An observable that emits the price of the specified asset or item.
   *
   * @remarks
   * - The method determines the appropriate remote quotes service based on the marketplace.
   * - It constructs a ticker using the provided marketplace and code, then fetches the price for that ticker.
   * - The response is mapped to extract the price for the specific ticker.
   */
  getRemoteQuote(marketPlace: MarketPlaceEnum | string, code: string) {
    if (typeof marketPlace === 'string') {
      marketPlace = MarketPlaceEnum[marketPlace as keyof typeof MarketPlaceEnum];
    }
    const service = this.getRemoteQuotesService(marketPlace as MarketPlaceEnum);
    const ticker = getMarketPlaceCode({ marketPlace, code });
    return service.price([ticker]).pipe(
      map(response => response[ticker])
    );
  }

  /**
   * Prepares and executes requests to update quotes for a given set of assets.
   *
   * @param assets - A record where the keys are asset tickers (formatted as "marketplace:ticker")
   *                 and the values are of type `AssetQuoteType`.
   * @returns An observable that emits a single object containing the aggregated results of the
   *          price updates for all tickers, where each key is a ticker and the value is its updated quote.
   *
   * The method groups the tickers by their marketplace, retrieves the appropriate remote quote service
   * for each marketplace, and requests price updates for the tickers in that marketplace. The results
   * are then combined into a single object.
   */
  prepareRequestsToUpdateQuotes(tickers: Ticker[]) {
    const marketPlaceRec = tickers.reduce((acc, ticker) => {
      const marketPlaceCode = ticker.split(':')[0];
      acc[marketPlaceCode] = [...(acc[marketPlaceCode] || []), ticker]
      return acc;
    }, {} as { [marketplace: string]: string[] });

    return forkJoin(
      Object.entries(marketPlaceRec).map(([marketPlaceCode, tickers]) => {
        const marketPlace = MarketPlaceEnum[marketPlaceCode as keyof typeof MarketPlaceEnum];
        const service = this.getRemoteQuotesService(marketPlace);
        return service.price(tickers);
      })).pipe(
        zipAll(),
        map(results => {
          return results.reduce((acc, item) => {
            acc = { ...acc, ...item };
            return acc;
          });
        })
      );
  }
}
