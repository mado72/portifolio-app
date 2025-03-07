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
    }
];
