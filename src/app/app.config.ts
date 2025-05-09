import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideExchangeService } from './service/exchange.service';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { HealthCheckInterceptor } from './interceptors/health-check.interceptor';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'pt'},
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { autoFocus: 'dialog', restoreFocus: true }
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HealthCheckInterceptor,
      multi: true
    },
    provideNativeDateAdapter(),
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withComponentInputBinding()), 
    provideAnimationsAsync(),
    provideHttpClient(),
    provideExchangeService(), 
    provideCharts(withDefaultRegisterables())
  ]
};
