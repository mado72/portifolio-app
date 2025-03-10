import { Injectable } from '@angular/core';
import { parseJSON } from 'date-fns';
import { forkJoin, map, Observable, of } from 'rxjs';
import portfoliosSource from '../../data/assets-portfolio.json';
import assetSource from '../../data/assets.json';
import { Asset, AssetAllocation, AssetEnum, Portfolio } from '../model/investment.model';
import { Currency } from '../model/domain.model';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  constructor() { }

  getAssets() : Observable<Asset[]> {
    return of(assetSource.data).pipe(
      map(list=> list.map(data=> ({
        ...data,
        type: AssetEnum[data.type as keyof typeof AssetEnum],
        lastUpdate: parseJSON(data.lastUpdate),
        quote: {
          amount: data.price,
          currency: Currency[data.currency as keyof typeof Currency]
        }
      })))
    );
  }

  getPortfolios() {
    return of(portfoliosSource.data as {
      [key: string]: {
        id: string;
        name: string;
        allocation: {
          code: string;
          quantity: number;
          marketPlace: string;
          marketValue: number;
          performance: number;
          percAllocation: number;
          percPlanned: number;
        }[];
      }
    });
  }

  // FIXME: Replace this with queries
  getAllDataMock() {
    return forkJoin({
      assets: this.getAssets(),
      portfolioData: this.getPortfolios(),
    }).pipe(
      map(({ assets, portfolioData }) => {
        const assetMap = new Map(assets.map(item=>[`${item.code}:${item.marketPlace}`, item]))
        return Object.values(portfolioData).map(portfolio=>{
          const assets = portfolio.allocation
            .map(allocation=>{
              const asset = assetMap.get(`${allocation.code}:${allocation.marketPlace}`);
              if (!asset) {
                return undefined;
              }
              return ({
                ...allocation,
                ...asset
              })
            })
            .filter(item => !!item) as AssetAllocation[]

          return {
            id: portfolio.id,
            name: portfolio.name,
            assets
          } as Portfolio;
        });
      })
    )
  }

  getPortfolioNames(): Observable<Portfolio[]> {
    // FIXME: Replace this with code to query the portfolio data
    return this.getPortfolios().pipe(
      map((portfolios) => Object.keys(portfolios).map(item=>({id: item, name: item, assets: []})) )
    );
  }

  getPortfolio(id: string): Observable<Portfolio | undefined> {
    return this.getAllDataMock().pipe(
      map(portfolios => portfolios.find(p => p.id === id))
    );
  }

  getPortfolioAllocations(portfolio: Portfolio): Observable<AssetAllocation[]> {
    return this.getAllDataMock().pipe(
      map(portfolios => portfolios.find(p => p.id === portfolio.id)?.assets || [])
    );
  }

}
