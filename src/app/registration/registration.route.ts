import { Routes } from "@angular/router";

export const registrationRoutes: Routes = [
    {
        path: 'assets',
        loadComponent: () => import('./asset-registration/asset-registration.component').then(mod => mod.AssetRegistrationComponent)
    },
    {
        path: 'earnings',
        loadComponent: () => import('./earnings-year-sheet/earnings-year-sheet.component').then(mod => mod.EarningsYearSheetComponent)
    },
    {
        path: 'accounts',
        loadComponent: () => import('../assets/balances/balances.component').then(mod => mod.BalancesComponent),
        data: {
            editEnable: true
        }
    },
    {
        path: 'portfolios',
        loadComponent: () => import('../investment/investment-portfolio-container/investment-portfolio-container.component').then(mod => mod.InvestmentPortfolioContainerComponent),
        data: {
            editMode: true
        }
    },
    {
        path: 'portfolio/:portfolioId',
        loadComponent: () => import('../investment/investment-portfolio-table/investment-portfolio-table.component').then(mod => mod.InvestmentPortfolioTableComponent),
        data: {
            editMode: true
        }
    }

]