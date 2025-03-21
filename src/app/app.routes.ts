import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/dashboard',
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/portfolio/portfolio.component').then(mod => mod.PortfolioComponent),
    },
    {
        path: 'balances',
        loadComponent: () => import('./assets/balances/balances.component').then(mod => mod.BalancesComponent),
    },
    {
        path: 'allocations',
        loadComponent: () => import('./assets/allocation-summary/allocation-summary.component').then(mod => mod.AllocationSummaryComponent),
    },
    {
        path: 'forecast',
        loadComponent: () => import('./assets/financial-forecast/financial-forecast.component').then(mod => mod.FinancialForecastComponent),
    },
    {
        path: 'forecast-summary',
        loadComponent: () => import('./assets/financial-forecast-summary/financial-forecast-summary.component').then(mod => mod.FinancialForecastSummaryComponent),
    },
    {
        path: 'investment',
        loadChildren: () => import('./investment/investment.route').then(mod => mod.investmentRoutes),
    },
    {
        path: 'registration',
        loadChildren: () => import('./registration/registration.route').then(mod => mod.registrationRoutes)
    }
];
