/**
 * Comparison utility functions
 *
 * Provides standardized comparison helpers to replace complex ternary patterns
 */

/**
 * Compare two strings for sorting, returning standard comparison result
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 *
 * @example
 * items.sort((a, b) => compareStrings(a.id, b.id))
 */
export function compareStrings(a: string, b: string): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Compare two numbers for sorting, returning standard comparison result
 *
 * @param a - First number to compare
 * @param b - Second number to compare
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 *
 * @example
 * items.sort((a, b) => compareNumbers(a.score, b.score))
 */
export function compareNumbers(a: number, b: number): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Compare two values with null/undefined handling
 * null/undefined values sort to the end
 *
 * @param a - First value (may be null/undefined)
 * @param b - Second value (may be null/undefined)
 * @param compareFn - Function to compare non-null values
 * @returns comparison result
 */
export function compareWithNulls<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  compareFn: (a: T, b: T) => number
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return compareFn(a, b);
}
