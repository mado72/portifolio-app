import { Routes } from '@angular/router';

export const assetRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/balances',
    },
    {
        path: 'balances',
        loadComponent: () => import('../statement/balances/balances.component').then(mod => mod.BalancesComponent),
        data: {
            editEnable: true
        }
    },
    {
        path: 'allocations',
        loadComponent: () => import('./allocation-summary/allocation-summary.component').then(mod => mod.AllocationSummaryComponent),
    },
    {
        path: 'forecast',
        loadComponent: () => import('../statement/financial-forecast/financial-forecast.component').then(mod => mod.FinancialForecastComponent),
    },
    {
        path: 'forecast-summary',
        loadComponent: () => import('../statement/financial-forecast-summary/financial-forecast-summary.component').then(mod => mod.FinancialForecastSummaryComponent),
    }
]