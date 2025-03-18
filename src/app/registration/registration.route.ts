import { Routes } from "@angular/router";

export const registrationRoutes: Routes = [
    {
        path: 'assets',
        loadComponent: () => import('./asset-registration/asset-registration.component').then(mod => mod.AssetRegistrationComponent)
    },
    {
        path: 'earnings',
        loadComponent: () => import('./investment-earnings-details/investment-earnings-details.component').then(mod => mod.InvestmentEarningsDetailsComponent)
    }

]