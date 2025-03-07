import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/balances',
    },
    {
        path: 'balances',
        loadComponent: () => import('./assets/balances/balances.component').then(mod => mod.BalancesComponent),
    },
];
