import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/dashboard',
    },
    {
        path: 'massive',
        loadComponent: () => import('./portfolio/massive-import/massive-import.component').then(mod => mod.MassiveImportComponent),
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/portfolio/portfolio.component').then(mod => mod.PortfolioComponent),
    },
    {
        path: 'investment',
        loadChildren: () => import('./investment/investment.route').then(mod => mod.investmentRoutes),
    },
    {
        path: 'cashflow',
        loadChildren: () => import('./cashflow/cashflow.route').then(mod => mod.cashflowRoutes),
    },
    {
        path: 'profitability',
        loadChildren: () => import('./profitability/profitability.route').then(mod => mod.profitabilityRoutes),
    }
];
