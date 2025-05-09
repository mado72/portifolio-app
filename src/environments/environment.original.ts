import { startOfDay } from "date-fns";

export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:8080/api/v1',  // Replace with your actual API URL
    twelvedata: {
        apiKey: 'bc1913e1b25343da8d342285061c581d'
    },
    marketPlace: {
        BVMF: {
            startTime: '10:00',
            endTime: '18:00',
            tz: 'America/Sao_Paulo'
        },
        COIN: {
            startTime: '09:00',
            endTime: '16:00',
            tz: 'America/Sao_Paulo'
        },
        CRYPTO: {
            startTime: '00:00',
            endTime: '24:00',
            tz: 'America/Sao_Paulo'
        },
        NASDAQ: {
            startTime: '09:30',
            endTime: '16:00',
            tz: 'America/New_York'
        },
        NYSE: {
            startTime: '09:30',
            endTime: '16:00',
            tz: 'America/New_York'
        },
        BRTD: {
            startTime: '09:30',
            endTime: '16:00',
            tz: 'America/Sao_Paulo'
        },
        IEX: {
            startTime: '09:00',
            endTime: '16:00',
            tz: 'America/New_York'
        },
        FOREX: {
            startTime: '09:00',
            endTime: '16:00',
            tz: 'America/New_York'
        },
        OTHER: {
            startTime: '09:00',
            endTime: '16:00',
            tz: 'America/New_York'
        },
    }
}