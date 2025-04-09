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
        path: 'earnings-month',
        loadComponent: () => import('./investment-earnings-month/investment-earnings-month.component').then(mod => mod.InvestmentEarningsMonthComponent)
    },
    {
        path: 'transactions',
        loadComponent: () => import('../cashflow/transaction-table/transaction-table.component').then(mod => mod.TransactionTableComponent)
    }

]