import { Routes } from "@angular/router";

export const transactionsRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list'
    },
    {
        path: 'list',
        loadComponent: () => import('./investment-transactions-control/investment-transactions-control.component').then(mod => mod.InvestmentTransactionsControlComponent)
    },
    {
        path: 'create',
        loadComponent: () => import('./investment-transactions-control/investment-transactions-control.component').then(mod => mod.InvestmentTransactionsControlComponent),
        data: {
            action: 'create'
        }
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./investment-transactions-control/investment-transactions-control.component').then(mod => mod.InvestmentTransactionsControlComponent),
        data: {
            action: 'edit'
        }
    }
]