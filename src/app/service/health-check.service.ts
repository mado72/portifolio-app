import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {
  private serverHealthSubject = new BehaviorSubject<boolean>(false);
  public serverHealth$ = this.serverHealthSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verifica o status do servidor a cada 15 segundos
    interval(15000).subscribe(() => this.checkServerHealth());
    this.checkServerHealth(); // Verifica imediatamente ao carregar
  }

  private checkServerHealth(): void {
    this.http.get<{ status: string }>(`${environment.apiBaseUrl}/health`)
      .pipe(
        catchError(() => {
          this.serverHealthSubject.next(false);
          return [];
        })
      )
      .subscribe(response => {
        const isHealthy = response?.status === 'UP';
        this.serverHealthSubject.next(isHealthy);
      });
  }

  public isServerHealthy(): Observable<boolean> {
    return this.serverHealth$;
  }
}