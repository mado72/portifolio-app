import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { concat, debounceTime, interval, map, Observable, of, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { groupBy } from '../model/functions.model';
import { MarketPlaceEnum } from '../model/investment.model';
import { QuoteResponse } from '../model/remote-quote.model';
import { AssetQuoteRecord, AssetQuoteType, Ticker } from '../model/source.model';
import { RemoteQuotesService } from './remote-quotes.service';

export const getMarketPlaceCode = ({ marketPlace, code }: { marketPlace: string | MarketPlaceEnum; code: string; }): string => {
  return marketPlace ? `${marketPlace}:${code}` : code;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private destroyRef = inject(DestroyRef);

  private remoteQuotesService = inject(RemoteQuotesService);

  readonly penddingToQuote = signal<Record<Ticker, AssetQuoteType>>({});

  readonly lastUpdate = signal<Date>(new Date(0));

  // Observable para recuperar as cotações remotas
  private requestQuotes$ = of({}).pipe(
    switchMap(() => {
      const pending = this.penddingToQuote();
      const requestByMarketplaceMap = groupBy(Object.keys(pending), ticker => ticker.replace(/:.*/, ''));

      const observables = Array.from(requestByMarketplaceMap.entries()).map(([marketPlace, tickers]) => {
        const request : AssetQuoteRecord = (tickers as string[]).reduce((acc, ticker) => {
          const asset = pending[ticker];
          acc[ticker] = asset;
          return acc;
        }
        , {} as AssetQuoteRecord);
        return this.remoteQuotesService.updateQuotes(request).pipe(
          map(response => ({request, response}))
        );
      });

      return concat(...observables).pipe(
        map(({request, response}) => {
          return this.processResponseToAssets(request, response);
        }),
        tap(() => {
          this.lastUpdate.set(new Date());
          this.penddingToQuote.set({});
        })
      )

    }),

    // Compartilha o resultado entre múltiplos assinantes
    shareReplay(1)
  )

  private timerRequestQuote$ = interval(1 * 60 * 1000).pipe(
    switchMap(() => this.requestQuotes$),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe();

  private updateTrigger = new Subject<void>();

  // Observable principal que gerencia as atualizações
  updateQuotes$ = this.updateTrigger.pipe(
    // Aguarda 1 minuto de inatividade
    debounceTime(1 * 60 * 1000),

    // Obtém os ativos pendentes no momento da execução
    switchMap(() => {
      const pendingAssets = this.penddingToQuote();

      // Se não houver ativos pendentes, retorna um objeto vazio
      if (Object.keys(pendingAssets).length === 0) {
        return of({} as { [ticker: Ticker]: AssetQuoteType });
      }

      // Chama o serviço remoto com os ativos pendentes
      return this.requestQuotes$.pipe(
        tap(() => {
          // Atualiza a data da última atualização
          this.lastUpdate.set(new Date());
          // Limpa a lista de pendentes
          this.penddingToQuote.set({});
        })
      );
    }),

    // Gerencia o ciclo de vida da assinatura
    takeUntilDestroyed(this.destroyRef)
  );

  constructor() {
    // Inicia o observable com um valor vazio
    this.updateQuotes$.pipe(startWith({})).subscribe();
  }

  private processResponseToAssets(request: AssetQuoteRecord, response: Record<string, QuoteResponse>) {
    if (Object.keys(request).length === 0) return {} as AssetQuoteRecord;

    return Object.entries(response).reduce((acc, [ticker, quote]) => {
      const original = request[ticker];
      if (!original) {
        console.warn(`Asset ${ticker} not found in request.`);
        return acc;
      }
      const initialPrice = original.initialPrice || quote.price;
      const asset = {
        ...original,
        quote: {
          value: quote.price,
          currency: quote.currency
        },
        initialPrice,
        trend: quote.price > initialPrice ? "up"
          : quote.price < initialPrice ? "down"
            : "unchanged",
        lastUpdate: new Date()
      } as AssetQuoteType;
      acc[ticker] = asset;
      return acc;
    }, {} as { [ticker: Ticker]: AssetQuoteType; });
  }

  addAssetToUpdate(asset: AssetQuoteType) {
    if (! asset) {
      return;
    }
    
    if (!!asset.manualQuote) {
      console.warn(`Asset ${asset.ticker} is not quotable.`);
      return;
    }

    // Adiciona o novo ativo
    this.penddingToQuote.update(pending => ({
      ...pending,
      [asset.ticker]: asset
    }));

    // Dispara o trigger para iniciar o processo de debounce
    this.updateTrigger.next();
  }

  /**
   * Adiciona múltiplos ativos à lista de pendentes
   */
  addAssetsToUpdate(assetsMap: AssetQuoteRecord): void {
    const assetsQuotable = Object.entries(assetsMap)
      .filter(([_, asset]) => !asset.manualQuote)
      .reduce((acc, [ticker, asset]) => {
        acc[ticker] = asset;
        return acc;
      }, {} as AssetQuoteRecord)

    if (Object.keys(assetsQuotable).length === 0) return;

    this.penddingToQuote.update(pending => ({
      ...pending,
      ...assetsQuotable
    }));

    // Dispara o trigger para iniciar o processo de debounce
    this.updateTrigger.next();
  }

  /**
   * Força uma atualização imediata (ignora o debounce)
   */
  forceUpdate(): Observable<{ [ticker: Ticker]: AssetQuoteType }> {
    const pendingAssets = this.penddingToQuote();

    if (Object.keys(pendingAssets).length === 0) {
      return of({});
    }

    return this.requestQuotes$;
  }

  getRemoteAssetInfo(ticker: Ticker) {
    const [marketPlace, code] = ticker.includes(':') ? ticker.split(':') : ['', ticker];
    return this.remoteQuotesService.getRemoteQuote(marketPlace, code);
  }

  getRemoteQuote(ticker: Ticker) {
    return this.getRemoteAssetInfo(ticker).pipe(
      map(resp => {
        if (!!resp) {
          return resp.price;
        }
        return null;
      })
    )
  }
}
