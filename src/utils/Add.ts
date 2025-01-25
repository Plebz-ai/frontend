/**
 * Utility functions for Add
 */

export function formatAdd(value: string): string {
  return value.toUpperCase();
}

export function validateAdd(value: string): boolean {
  return value.length > 0;
}

export default {
  formatAdd,
  validateAdd
};
