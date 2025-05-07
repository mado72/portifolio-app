import { Component, computed, inject, input, LOCALE_ID, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Currency } from '../../model/domain.model';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';

export const secondaryPalette = [
    {
        "backgroundColor": "transparent",  // Magenta
        "borderColor": "rgba(214, 48, 160, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [1, 4]
    },
    {
        "backgroundColor": "transparent",   // Amarelo/dourado
        "borderColor": "rgba(255, 193, 7, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [8, 4]
    },
    {
        "backgroundColor": "transparent",   // Verde
        "borderColor": "rgba(40, 167, 69, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [3, 3]
    },
    {
        "backgroundColor": "transparent",   // Laranja
        "borderColor": "rgba(255, 87, 34, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [5, 2]
    },
    {
        "backgroundColor": "transparent",   // Roxo escuro
        "borderColor": "rgba(72, 52, 212, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [6, 3]
    },
    {
        "backgroundColor": "transparent",   // Rosa escuro
        "borderColor": "rgba(233, 30, 99, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [2, 6]
    },
    {
        "backgroundColor": "transparent",  // Roxo claro
        "borderColor": "rgba(108, 92, 231, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [2, 2]
    },
    {
        "backgroundColor": "transparent",  // Cinza azulado
        "borderColor": "rgba(96, 125, 139, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [1, 1]
    },
    {
        "backgroundColor": "transparent",   // Laranja claro
        "borderColor": "rgba(255, 152, 0, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [4, 4]
    },
    {
        "backgroundColor": "transparent",    // Linha principal: azul forte
        "borderColor": "rgba(0, 123, 255, 1)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 3
    }, 
    {
        "backgroundColor": "transparent",  // Roxo vibrante
        "borderColor": "rgba(156, 39, 176, 0.8)",
        "pointBackgroundColor": "transparent",
        "borderWidth": 2,
        "borderDash": [7, 2]
    }
];

@Component({
    selector: 'app-portfolio-evolution-chart',
    standalone: true,
    imports: [
        BaseChartDirective
    ],
    template: `
    <div class="chart-container">
      <canvas baseChart
        [data]="lineChartData()"
        [options]="lineChartOptions()"
        [plugins]="plugins"
        [type]="lineChartType"
        (chartHover)="chartHovered($event)"
        (chartClick)="chartClicked($event)">
      </canvas>
    </div>
  `,
    styles: [`
    .chart-container {
      display: block;
      height: 400px;
      width: 100%;
    }
    `]
})
export class PortfolioEvolutionChartComponent {

    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

    private locale = inject(LOCALE_ID);

    readonly currency = input<Currency>(Currency.BRL);

    readonly secondariesRows = input<{
        label: string;
        values: number[];
    }[]>([]);

    readonly profitabilityEvolutionData = input<{ label: string, values: number[] } | null>(null);

    readonly accumulatedData = input<{ label: string, values: number[] } | null>(null);

    plugins = [DataLabelsPlugin];

    readonly lineChartData = computed<ChartConfiguration['data']>(() => {
        const profitabilityEvolutionData = this.profitabilityEvolutionData() || { label: '', values: [] };
        const profitabilityData = this.secondariesRows();
        const accumulatedData = this.accumulatedData() || { label: '', values: [] };

        const data = {
            datasets: [
                {
                    data: accumulatedData.values,
                    label: accumulatedData.label || 'Acumulado',
                    type: 'bar',
                    backgroundColor: 'rgba(168, 130, 86, 0.2)',    // Marrom claro neutro
                    borderColor: 'rgba(168, 130, 86, 1)',
                    pointBackgroundColor: 'rgba(168, 130, 86, 1)',                    
                    borderWidth: 1,
                    yAxisID: 'y-axis-left',
                    datalabels: { // Configuração específica para o DataLabels
                        display: true,
                        anchor: 'center',
                        align: 'center',
                        formatter: (value: number) => {
                            return new Intl.NumberFormat(this.locale, {
                                style: 'percent',
                                maximumFractionDigits: 2
                            }).format(value);
                        },
                        color: 'rgba(23, 92, 39, 1)',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                {
                    data: profitabilityEvolutionData.values,
                    label: profitabilityEvolutionData.label || 'Rentabilidade',
                    type: 'line',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    fill: 'origin',
                    tension: 0.4, // Suaviza a linha
                    yAxisID: 'y-axis-right'
                }
            ],
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        } as ChartConfiguration['data'];

        profitabilityData.forEach((item, index) => {
            data.datasets.push({
                data: item.values,
                label: item.label,
                type: 'line',
                fill: 'origin',
                tension: 0.4,
                yAxisID: 'y-axis-right',
                ...secondaryPalette[index % secondaryPalette.length], // Usa a paleta secundária
            });
        });

        return data;
    });

    readonly lineChartOptions = computed<ChartConfiguration['options']>(() => {
        const currencyCode = this.currency(); // Obtém o valor do input currency
        const localeValue = this.locale; // Captura o valor do locale para usar nas funções de callback

        const accumulatedData = this.accumulatedData() || { label: '', values: [] };
        const formats = [
            new Intl.NumberFormat(localeValue, { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }),
            new Intl.NumberFormat(localeValue, { style: 'percent', maximumFractionDigits: 2 }),
        ];

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                const formatter = formats[context.datasetIndex] as Intl.NumberFormat; // Usa o formato correto baseado no índice do dataset
                                label += formatter.format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Evolução do Portfólio',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                subtitle: {
                    display: true,
                    text: `${new Date().getFullYear()}`,
                    font: {
                        size: 16,
                        weight: 'normal'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                datalabels: { // Configuração global do DataLabels
                    display: false
                }
            },
            scales: {
                x: {},
                'y-axis-left': {
                    position: 'left',
                    ticks: {
                        callback: function (value) {
                            return new Intl.NumberFormat(localeValue, {
                                style: 'percent',
                                maximumFractionDigits: 2
                            }).format(value as number);
                        }
                    }
                },
                'y-axis-right': {
                    position: 'right',
                    grid: {
                        drawOnChartArea: false, // Evita sobreposição de grades
                    },
                    ticks: {
                        callback: function (value) {
                            return new Intl.NumberFormat(localeValue, {
                                style: 'currency',
                                currency: currencyCode, // Usa o valor do input currency
                                maximumFractionDigits: 0
                            }).format(value as number);
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4 // Suaviza a linha
                }
            }
        };
    });

    readonly lineChartType: ChartType = 'bar'; // Tipo principal do gráfico

    // Eventos
    chartClicked({ event, active }: { event?: any, active?: {}[] }): void {
        // console.log(event, active);
    }

    chartHovered({ event, active }: { event?: any, active?: {}[] }): void {
        // console.log(event, active);
    }
}

