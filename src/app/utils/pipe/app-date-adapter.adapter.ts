import { Provider } from "@angular/core";
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from "@angular/material/core";
import { UTCDate } from '@date-fns/utc';
import { addDays, addMonths, addYears, format, getDaysInMonth, getMonth, getYear, parse, setDay, setMonth, toDate } from "date-fns";
import { it as locale } from 'date-fns/locale';
import { getZonedDate } from "../../model/functions.model";

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

export function provideAppDateAdapter(format: MatDateFormats = DATE_FNS_FORMATS): Provider[] {
    return [
        { provide: DateAdapter, useClass: AppDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: format },
    ]
}


function range(start: number, end: number): number[] {
    let arr: number[] = [];
    for (let i = start; i <= end; i++) {
        arr.push(i);
    }
    return arr;
}

export class AppDateAdapter extends DateAdapter<UTCDate, Date> {
    override getYear(date: UTCDate): number {
        return getYear(date);
    }
    override getMonth(date: UTCDate): number {
        return getMonth(date);
    }
    override getDate(date: UTCDate): number {
        return getZonedDate(date);
    }
    override getDayOfWeek(date: UTCDate): number {
        return parseInt(format(date, 'i'), 10);
    }
    override getMonthNames(style: "long" | "short" | "narrow"): string[] {
        const map = {
            long: 'LLLL',
            short: 'LLL',
            narrow: 'LLLLL'
        };

        let formatStr = map[style];
        let date = new Date();

        return range(0, 11).map(month =>
            format(setMonth(date, month), formatStr, {
                locale
            })
        );
    }
    override getDateNames(): string[] {
        return range(1, 31).map(day => String(day));
    }
    override getDayOfWeekNames(style: "long" | "short" | "narrow"): string[] {
        const map = {
            long: 'EEEE',
            short: 'E..EEE',
            narrow: 'EEEEE'
        };

        let formatStr = map[style];
        let date = new Date();

        return range(0, 6).map(month =>
            format(setDay(date, month), formatStr, {
                locale
            })
        );
    }
    override getYearName(date: UTCDate): string {
        return format(date, 'yyyy', {
            locale
        });
    }
    override getFirstDayOfWeek(): number {
        return 0;
    }
    override getNumDaysInMonth(date: UTCDate): number {
        return getDaysInMonth(date);
    }
    override clone(date: UTCDate): UTCDate {
        return toDate(date);
    }
    override createDate(year: number, month: number, date: number): UTCDate {
        return new UTCDate(year, month, date);
    }
    override today(): UTCDate {
        return new UTCDate();
    }
    override parse(value: any, parseFormat: any): UTCDate | null {
        console.log(value, parseFormat);
        if (value === null) {
            return null;
        }
        return new UTCDate(parse(value, parseFormat, new UTCDate(), {
            locale
        }));
    }
    override format(date: UTCDate, displayFormat: any): string {
        return format(date, displayFormat, {
            locale
        });
    }
    override addCalendarYears(date: UTCDate, years: number): UTCDate {
        return addYears(date, years);
    }
    override addCalendarMonths(date: UTCDate, months: number): UTCDate {
        return addMonths(date, months);
    }
    override addCalendarDays(date: UTCDate, days: number): UTCDate {
        return addDays(date, days);
    }
    override toIso8601(date: UTCDate): string {
        return date.toISOString();
    }
    override isDateInstance(obj: any): boolean {
        return obj instanceof Date || obj instanceof UTCDate;
    }
    override isValid(date: UTCDate): boolean {
        return this.isDateInstance(date) && !isNaN(date.getTime());
    }
    override invalid(): UTCDate {
        return new UTCDate(NaN);
    }
}
