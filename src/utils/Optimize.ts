/**
 * Utility functions for Optimize
 */

export function formatOptimize(value: string): string {
  return value.toUpperCase();
}

export function validateOptimize(value: string): boolean {
  return value.length > 0;
}

export default {
  formatOptimize,
  validateOptimize
};
