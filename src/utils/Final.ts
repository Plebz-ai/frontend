/**
 * Utility functions for Final
 */

export function formatFinal(value: string): string {
  return value.toUpperCase();
}

export function validateFinal(value: string): boolean {
  return value.length > 0;
}

export default {
  formatFinal,
  validateFinal
};
