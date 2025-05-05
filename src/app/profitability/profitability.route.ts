import { Routes } from "@angular/router";

export const profitabilityRoutes: Routes = [

    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./profitability/profitability.component').then(m=>m.ProfitabilityComponent)
    }
]