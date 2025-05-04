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
        loadComponent: () => import('../portfolio/portfolio-register/portfolio-register.component').then(mod => mod.PortfolioRegisterComponent),
        data: {
            editable: true
        }
    },
    {
        path: 'incomes',
        data: {
            back: '/investment/incomes',
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./income-year-sheet/income-year-sheet.component').then(mod => mod.IncomeYearSheetComponent),
                pathMatch: 'full'
            },
            {
                path: 'transactions',
                loadChildren: () => import('./transactions.route').then(mod => mod.transactionsRoutes),
            }
        ]
    },
    {
        path: 'transactions',
        loadChildren: () => import('./transactions.route').then(mod => mod.transactionsRoutes),
    }

]