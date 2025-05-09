import { Component, OnInit } from '@angular/core';
import { HealthCheckService } from '../../service/health-check.service';

@Component({
    selector: 'app-health-status',
    standalone: true,
    template: `
        <div class="health-status">
            <span [class]="isServerHealthy ? 'healthy' : 'unhealthy'">
                {{ isServerHealthy ? '🟢' : '🔴' }}
            </span>
        </div>`,
    styles: `
        .health-status {
        font-size: 0.6rem;
        font-weight: bold;
        }

        .healthy {
        color: green;
        }

        .unhealthy {
        color: red;
        }
        `
})
export class HealthStatusComponent implements OnInit {
    isServerHealthy: boolean = false;

    constructor(private healthCheckService: HealthCheckService) { }

    ngOnInit(): void {
        this.healthCheckService.isServerHealthy().subscribe(status => {
            this.isServerHealthy = status;
        });
    }
}