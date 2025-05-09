import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { HealthCheckService } from '../service/health-check.service';
import { first, switchMap } from 'rxjs/operators';

@Injectable()
export class HealthCheckInterceptor implements HttpInterceptor {
  constructor(private healthCheckService: HealthCheckService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/health')) {
      return next.handle(req); // Permite requisições ao endpoint de health
    }

    return this.healthCheckService.isServerHealthy().pipe(
      first(),
      switchMap(isHealthy => {
        if (!isHealthy) {
          return throwError(() => new Error('Servidor indisponível.'));
        }
        return next.handle(req);
      })
    );
  }
}