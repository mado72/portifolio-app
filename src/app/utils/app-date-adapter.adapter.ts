import { Provider } from "@angular/core";
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from "@angular/material/core";
import { addDays, addMonths, addYears, endOfMonth, format, formatISO, getYear, isDate, parse, startOfMonth } from "date-fns";

export const DATE_FNS_FORMATS: MatDateFormats = {
    parse: {
        dateInput: 'P',
    },
    display: {
        dateInput: 'P',
        monthYearLabel: 'LLL uuuu',
        dateA11yLabel: 'PP',
        monthYearA11yLabel: 'LLLL uuuu',
    },
};

export function provideAppDateAdapter (format: MatDateFormats = DATE_FNS_FORMATS): Provider[] {
    return [
        {provide: DateAdapter, useClass: AppDateAdapter},
        {provide: MAT_DATE_FORMATS, useValue: format },
    ]
}

export class AppDateAdapter extends DateAdapter<Date, Date> {
    getYear(date: Date): number {
        return getYear(date);
    }
    getMonth(date: Date): number {
        return date.getMonth();
    }
    getDate(date: Date): number {
        return date.getDate();
    }
    getDayOfWeek(date: Date): number {
        return date.getDay();
    }
    getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        switch (style) {
            case 'long': return ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            case 'short': return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            case 'narrow': return ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        }
    }
    getDateNames(): string[] {
        return new Array(31).fill(0).map((_, i) => (i + 1).toString());
    }
    getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        switch (style) {
            case 'long': return ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            case 'short': return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            case 'narrow': return ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        }
    }
    getYearName(date: Date): string {
        return getYear(date).toString();
    }
    getFirstDayOfWeek(): number {
        return 0;
    }
    getNumDaysInMonth(date: Date): number {
        return endOfMonth(date).getDate();
    }
    clone(date: Date): Date {
        return new Date(date.getTime());
    }
    createDate(year: number, month: number, date: number): Date {
        return new Date(year, month, date);
    }
    today(): Date {
        return new Date();
    }
    parse(value: any, parseFormat: any): Date {
        return parse(value, parseFormat, startOfMonth(new Date()));
    }
    format(date: Date, displayFormat: any): string {
        return format(date, displayFormat);
    }
    addCalendarYears(date: Date, years: number): Date {
        return addYears(date, years);
    }
    addCalendarMonths(date: Date, months: number): Date {
        return addMonths(date, months);
    }
    addCalendarDays(date: Date, days: number): Date {
        return addDays(date, days);
    }
    toIso8601(date: Date): string {
        return formatISO(date);
    }
    isDateInstance(obj: any): boolean {
        return isDate(obj);
    }
    isValid(date: Date): boolean {
        return true;
    }
    invalid(): Date {
        return new Date();
    }

}