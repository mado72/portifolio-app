import { Interval, eachDayOfInterval, eachMonthOfInterval, eachQuarterOfInterval, eachWeekOfInterval, eachYearOfInterval, getDay, isWithinInterval, setDate, setDay } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { Scheduled } from "./domain.model";

/**
* @description
* Takes an Array<V>, and a grouping function,
* and returns a Map of the array grouped by the grouping function.
*
* @param list An array of type V.
* @param keyGetter A Function that takes the the Array type V as an input, and returns a value of type K.
*                  K is generally intended to be a property key of V.
*
* @returns Map of the array grouped by the grouping function.
*/
export function groupBy<K, V>(list: V[], keyGetter: (v: V) => K): Map<K, V[]> {
    const map = new Map<K, V[]>();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}

/**
 * @description
 * Converts an array of objects into a record (object) using a key-getter function.
 * The key-getter function is used to extract a unique key from each object in the array.
 * The resulting record has the unique keys as its keys and the corresponding objects as its values.
 *
 * @template T - The type of the objects in the array.
 * @template K - The type of the keys extracted from the objects.
 *
 * @param array - The array of objects to be converted into a record.
 * @param keyGetter - A function that takes an object of type T and returns a key of type K.
 *
 * @returns A record (object) where the keys are the unique keys extracted from the objects,
 *          and the values are the corresponding objects from the array.
 */
export function toRecord<T extends Record<string, any>, K extends keyof T>(array: T[], keyGetter: (v: T) => K): Record<T[K], T> {
    return array.reduce((acc, item) => ({ ...acc, [item[keyGetter(item)]]: item }), {} as Record<T[K], T>)
}

/**
 * @description
 * Divides two numbers and rounds the result to a specified precision.
 *
 * @param dividend - The number to be divided.
 * @param divisor - The number by which to divide the dividend.
 * @param precision - The number of decimal places to round the result to. Default is 2.
 *
 * @returns The result of dividing the dividend by the divisor, rounded to the specified precision.
 */
export function divide(dividend: number, divisor: number, precision: number = 2) {
    const factor = 10 ^ precision;
    return Math.trunc((dividend * factor) / divisor) / factor;
}

/**
 * Generates a list of dates based on a specified scheduling pattern and filters them
 * to ensure they fall within a given date range.
 *
 * @param scheduledRange - The interval representing the range of dates to generate the schedule from.
 * @param dateRange - The interval representing the range of dates to filter the generated schedule.
 * @param schedule - The scheduling pattern to use for generating dates (e.g., daily, weekly, monthly, etc.).
 * @returns An array of dates that match the scheduling pattern and fall within the specified date range.
 */
export function getScheduleDates(scheduledRange: Interval, dateRange: Interval, schedule: Scheduled) {
    let dates: Date[];

    switch (schedule) {
        case Scheduled.DIARY: {
            dates = eachDayOfInterval(scheduledRange);
            break;
        }
        case Scheduled.WEEKLY: {
            dates = eachWeekOfInterval(scheduledRange)
                .map(date=>setDay(date, getDay(scheduledRange.start)));
            break;
        }
        case Scheduled.FORTNIGHTLY: {
            dates = eachWeekOfInterval(scheduledRange)
                .filter((_,idx)=>idx %2 === 0)
                .map(date=>setDay(date, getDay(scheduledRange.start)));
            break;
        }
        case Scheduled.MONTHLY: {
            dates = eachMonthOfInterval(scheduledRange)
                .map(date=>setDate(date, getZonedDate(scheduledRange.start as Date)));
            break;
        }
        case Scheduled.QUARTER: {
            dates = eachQuarterOfInterval(scheduledRange)
                .map(date=>setDate(date, getZonedDate(scheduledRange.start as Date)));
            break;
        }
        case Scheduled.HALF_YEARLY: {
            dates = eachMonthOfInterval(scheduledRange).filter((_,idx)=>idx % 6 === 0)
                .map(date=>setDate(date, getZonedDate(scheduledRange.start as Date)));
            break;
        }
        case Scheduled.YEARLY: {
            dates = eachYearOfInterval(scheduledRange)
                .map(date=>setDate(date, getZonedDate(scheduledRange.start as Date)));
            break;
        }
        default: {
            const date = scheduledRange.start as Date;
            dates = [date];
        }
    }
    return dates.filter(date => isWithinInterval(date, dateRange));
}

export function parseDateYYYYMMDD(source: string) {
    // const [year, month, day] = source.split('-').map(Number);
    // // Create a date using UTC
    // return new Date(Date.UTC(year, month - 1, day));
    const utcDate = fromZonedTime(`${source}T00:00:00`, 'UTC')
    return utcDate;
}

export function getZonedDate(date: Date | string) {
    if (typeof date === 'string') {
        date = parseDateYYYYMMDD(date as string);
    }
    const day = formatInTimeZone(date as Date, 'UTC', 'd');
    return Number(day);
}

export function isSameZoneDate(d1: Date, d2: Date) {
    const s1 = formatInTimeZone(d1, 'UTC', 'yyyy-MM-dd');
    const s2 = formatInTimeZone(d2, 'UTC', 'yyyy-MM-dd');
    return s1 === s2;
}