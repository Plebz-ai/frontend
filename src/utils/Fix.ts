/**
 * Utility functions for Fix
 */

export function formatFix(value: string): string {
  return value.toUpperCase();
}

export function validateFix(value: string): boolean {
  return value.length > 0;
}

export default {
  formatFix,
  validateFix
};
