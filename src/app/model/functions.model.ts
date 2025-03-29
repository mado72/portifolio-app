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
export function groupBy<K, V>(list: V[], keyGetter: (v: V) => K): Map<K, V[]>{
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
