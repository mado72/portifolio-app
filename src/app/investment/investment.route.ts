import { Routes } from "@angular/router";

export const investmentRoutes: Routes = [
    {
        path: 'assets',
        loadComponent: () => import('./investment-assets-table/investment-assets-table.component').then(mod => mod.InvestmentAssetsTableComponent),
        data: {
            editable: true
        }
    },
    {
        path: 'portfolio',
        loadComponent: () => import('../portfolio/portfolio-register-table/portfolio-register-table.component').then(mod => mod.PortfolioRegisterTableComponent),
        data: {
            editable: true
        }
    },
    {
        path: 'earnings',
        loadComponent: () => import('./earnings-year-sheet/earnings-year-sheet.component').then(mod => mod.EarningsYearSheetComponent)
    },
    {
        path: 'transactions',
        children: [
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
            },
        ]
    }

]