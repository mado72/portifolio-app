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
        path: 'assets',
        loadChildren: () => import('./assets/assets.route').then(mod => mod.assetRoutes),
    },
    {
        path: 'investment',
        loadChildren: () => import('./investment/investment.route').then(mod => mod.investmentRoutes),
    },
    {
        path: 'statement',
        loadChildren: () => import('./statement/statement.route').then(mod => mod.statementRoutes),
    }
];
