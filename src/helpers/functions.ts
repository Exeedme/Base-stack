import { format, getUnixTime, startOfDay, startOfHour, startOfMonth, startOfWeek } from 'date-fns';

/**
 * Function that sleeps for a given number of milliseconds.
 * @param ms
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Function that returns an array with the unique elements.
 * @param elements
 */
export function unique<T>(elements: T[]): T[] {
  return [...new Set(elements)];
}

/**
 * Function that returns a random element from an array.
 * @param elements
 */
export function sample<T>(elements: T[]): T {
  return elements[Math.floor(Math.random() * elements.length)]!;
}

/**
 * Function that calculates the difference between two arrays.
 * That is, it returns the elements that are part of the first but not the second.
 * @param array1
 * @param array2
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  const array2Set = new Set(array2);

  const result: T[] = [];
  for (const elem of array1) {
    if (!array2Set.has(elem)) {
      result.push(elem);
    }
  }
  return result;
}

/**
 * Function that generates a random string with a given length.
 * @param length
 * @returns
 */
export function randomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Function that returns random string of letters with a given length.
 * @param length
 * @returns
 */
export function randomStringLetters(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Function that returns if a number is a power of two.
 * @param x
 * @returns
 */
export function isPowerOfTwo(x: number): boolean {
  return Math.log2(x) % 1 === 0;
}

/**
 * Function that calculates the epoch day for a given date.
 * @param date
 * @returns
 */
export function getEpochDay(date: Date): number {
  return Math.floor(getUnixTime(date) / 60 / 60 / 24);
}

/**
 * Function that gets the string representation of the epoch hour for a given date.
 * @param date
 * @returns
 */
export function getEpochHourString(date: Date): string {
  return format(startOfHour(date), "yyyy-MM-dd'T'HH:00");
}

/**
 * Function that gets the string representation of the epoch day for a given date.
 * @param date
 * @returns
 */
export function getEpochDayString(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

/**
 * Function that gets the string representation of the epoch week for a given date.
 * @param date
 * @returns
 */
export function getEpochWeekString(date: Date): string {
  return format(startOfWeek(date), 'yyyy-MM-dd');
}

/**
 * Function that gets the string representation of the epoch week for a given date.
 * @param date
 * @returns
 */
export function getEpochMonthString(date: Date): string {
  return format(startOfMonth(date), 'yyyy-MM-dd');
}

/**
 * Function that shuffles an array.
 * @param elements
 */
export function shuffle<T>(elements: T[]): T[] {
  let currentIndex = elements.length;
  while (currentIndex != 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [elements[currentIndex], elements[randomIndex]] = [
      elements[randomIndex]!,
      elements[currentIndex]!,
    ];
  }

  return elements;
}

/**
 * Function that returns an array with groups of 'size' consecutive elements.
 * @param arr
 * @param size
 * @returns
 */
export function arrayWindows<T>(elements: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < elements.length - size + 1; i++) {
    result.push(elements.slice(i, i + size));
  }
  return result;
}

/**
 * Function that returns an array with groups of 'size' elements.
 * @param array
 * @param size
 * @returns
 */
export function arrayChunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
