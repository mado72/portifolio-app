import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/saldos',
    },
    {
        path: 'saldos',
        loadComponent: () => import('./ativos/saldos/saldos.component').then(mod => mod.SaldosComponent),
    },
];
