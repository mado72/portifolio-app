import { Routes } from '@angular/router';

export const transactionRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/recurrence',
    },
    {
        path: 'recurrence',
        loadComponent: () => import('./recurrence-transaction-list/recurrence-transaction-list.component').then(mod => mod.RecurrenceTransactionListComponent),
        data: {
            editable: true
        }
    }
]