/**
 * Utility functions for Configure
 */

export function formatConfigure(value: string): string {
  return value.toUpperCase();
}

export function validateConfigure(value: string): boolean {
  return value.length > 0;
}

export default {
  formatConfigure,
  validateConfigure
};
