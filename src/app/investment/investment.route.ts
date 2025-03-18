import { Routes } from "@angular/router";

export const investmentRoutes: Routes = [
    {
        path: 'assets',
        loadComponent: () => import('./investment-assets-portlet/investment-assets-portlet.component').then(mod => mod.InvestmentAssetsPortletComponent),
    },
    {
        path: 'portfolio',
        loadComponent: () => import('./investment-portfolio-container/investment-portfolio-container.component').then(mod => mod.InvestmentPortfolioContainerComponent),
    },
    {
        path: 'earnings',
        loadComponent: () => import('./investment-earnings-table/investment-earnings-table.component').then(mod => mod.InvestmentEarningsTableComponent)
    }

]