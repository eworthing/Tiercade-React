/**
 * Standardized ID generation utility
 *
 * Generates unique IDs with consistent format: `{prefix}-{timestamp}-{random}`
 */

const RANDOM_STRING_LENGTH = 7;

/**
 * Generate a random alphanumeric string
 */
function randomString(length: number = RANDOM_STRING_LENGTH): string {
  return Math.random().toString(36).slice(2, 2 + length);
}

/**
 * Generate a unique ID with the given prefix
 *
 * @param prefix - The prefix for the ID (e.g., 'item', 'toast', 'tier')
 * @returns A unique ID in format `{prefix}-{timestamp}-{random}`
 *
 * @example
 * generateId('item')  // 'item-1704067200000-a1b2c3d'
 * generateId('toast') // 'toast-1704067200000-x9y8z7w'
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomString()}`;
}

/**
 * Generate a simple ID without timestamp (for non-persisted elements)
 *
 * @param prefix - The prefix for the ID
 * @returns A simple ID in format `{prefix}-{random}`
 *
 * @example
 * generateSimpleId('input') // 'input-a1b2c3d'
 */
export function generateSimpleId(prefix: string): string {
  return `${prefix}-${randomString()}`;
}
