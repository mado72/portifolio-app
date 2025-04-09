import { Routes } from '@angular/router';

export const cashflowRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/balances',
    },
    {
        path: 'balances',
        loadComponent: () => import('./balances/balances.component').then(mod => mod.BalancesComponent),
        data: {
            editable: true
        }
    },
    {
        path: 'scheduled',
        loadComponent: () => import('./scheduled-transaction-list/scheduled-transaction-list.component').then(mod => mod.ScheduledTransactionListComponent),
        data: {
            editable: true
        }
    },
    {
        path: 'forecast',
        loadComponent: () => import('./financial-forecast/financial-forecast.component').then(mod => mod.FinancialForecastComponent),
    },
    {
        path: 'forecast-summary',
        loadComponent: () => import('./financial-forecast-summary/financial-forecast-summary.component').then(mod => mod.FinancialForecastSummaryComponent),
    }
]