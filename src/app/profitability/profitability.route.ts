import { Routes } from "@angular/router";

export const profitabilityRoutes: Routes = [

    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./profitability/profitability.component').then(m=>m.ProfitabilityComponent)
    }
]