import { Routes } from "@angular/router";

export const investmentRoutes: Routes = [
    {
        path: 'assets',
        loadComponent: () => import('./investment-assets-portlet/investment-assets-portlet.component').then(mod => mod.InvestmentAssetsPortletComponent),
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
        loadComponent: () => import('./investment-earnings-month/investment-earnings-month.component').then(mod => mod.InvestmentEarningsMonthComponent)
    },
    {
        path: 'transactions',
        loadComponent: () => import('../transaction/transaction-table/transaction-table.component').then(mod => mod.TransactionTableComponent)
    }

]